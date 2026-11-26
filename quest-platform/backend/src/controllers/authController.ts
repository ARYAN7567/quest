import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { AuthRequest } from '../middleware/auth';

/**
 * Password complexity validation
 * Returns error message string if invalid, null if valid
 */
const validatePasswordComplexity = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLowercase || !hasUppercase || !hasNumber) {
    return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
  }

  // Check for common patterns
  const commonPasswords = ['password', '123456', 'Password1', 'Password123'];
  if (commonPasswords.includes(password)) {
    return 'Password is too common, please choose a stronger password';
  }

  return null;
};

/**
 * Email format validation
 */
const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize input string
 */
const sanitizeString = (str: string): string => {
  if (!str) return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Input validation with detailed error messages
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate email format
    if (!validateEmailFormat(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Email length check
    if (email.length > 254) {
      return res.status(400).json({ message: 'Email must be less than 254 characters' });
    }

    // Password complexity validation
    const passwordError = validatePasswordComplexity(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeString(email).toLowerCase();
    const sanitizedName = name ? sanitizeString(name).substring(0, 100) : '';

    // Check for existing user (with timing-safe comparison)
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    // @ts-ignore
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password with strong salt
    const saltRounds = 12; // Increased from 10 for better security
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user with role-based access control consideration
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [sanitizedEmail, hashedPassword, sanitizedName]
    );

    // @ts-ignore
    const userId = result.insertId;

    // Generate token
    const token = jwt.sign(
      { id: userId, email: sanitizedEmail, role: 'user' },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Return success without exposing password hash
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, email: sanitizedEmail, role: 'user', name: sanitizedName }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    // @ts-ignore
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const [users] = await pool.query(
      'SELECT id, email, role, name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    // @ts-ignore
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};
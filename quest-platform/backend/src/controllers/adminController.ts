import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Admin Dashboard Stats
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Total users
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    // @ts-ignore
    const totalUsers = userCount[0]?.count || 0;

    // Total quests
    const [questCount] = await pool.query('SELECT COUNT(*) as count FROM quests');
    // @ts-ignore
    const totalQuests = questCount[0]?.count || 0;

    // Total questions
    const [questionCount] = await pool.query('SELECT COUNT(*) as count FROM questions');
    // @ts-ignore
    const totalQuestions = questionCount[0]?.count || 0;

    // Total revenue
    const [revenue] = await pool.query(
      'SELECT SUM(amount) as total FROM payments WHERE status = "completed"'
    );
    // @ts-ignore
    const totalRevenue = revenue[0]?.total || 0;

    // Recent users
    const [recentUsers] = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE role = "user" ORDER BY created_at DESC LIMIT 5'
    );

    // Recent payments
    const [recentPayments] = await pool.query(
      `SELECT p.*, u.email as user_email, q.title as quest_title
       FROM payments p
       JOIN users u ON p.user_id = u.id
       JOIN quests q ON p.quest_id = q.id
       WHERE p.status = "completed"
       ORDER BY p.created_at DESC LIMIT 5`
    );

    res.json({
      stats: {
        totalUsers,
        totalQuests,
        totalQuestions,
        totalRevenue
      },
      recentUsers,
      recentPayments
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// Admin: Get all users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const [users] = await pool.query(
      `SELECT id, email, name, role, created_at,
        (SELECT COUNT(*) FROM submissions WHERE user_id = users.id) as submissions_count
       FROM users
       WHERE role = "user"
       ORDER BY created_at DESC`
    );

    // @ts-ignore
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Admin: Get all submissions for a quest with user details
export const getQuestSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { questId } = req.params;

    const [submissions] = await pool.query(
      `SELECT s.*, u.email, u.name
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE s.quest_id = ?
       ORDER BY s.submitted_at DESC`,
      [questId]
    );

    // @ts-ignore
    const parsedSubmissions = submissions.map(s => ({
      ...s,
      answers: typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers
    }));

    // @ts-ignore
    res.json({ submissions: parsedSubmissions });
  } catch (error) {
    console.error('Get quest submissions error:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};
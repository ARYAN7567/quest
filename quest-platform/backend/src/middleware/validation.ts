/**
 * Input Validation Middleware Module
 *
 * Provides validation for authentication, quest, question, and submission inputs.
 * Uses express-validator style validation patterns.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Validation result type
 */
interface ValidationResult {
  errors: Array<{ field: string; message: string; value: any }>;
  isValid: boolean;
}

/**
 * Extracts validation errors from request body
 */
export const validateAuth = (req: Request, res: Response, next: NextFunction) => {
  const errors: Array<{ field: string; message: string; value: any }> = [];
  const { email, password, name } = req.body;

  // Email validation
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required', value: email });
  } else if (typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string', value: email });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format', value: email });
  } else if (email.length > 254) {
    errors.push({ field: 'email', message: 'Email must be less than 254 characters', value: email });
  }

  // Password validation
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required', value: password });
  } else if (typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password must be a string', value: password });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters', value: password });
  } else if (password.length > 128) {
    errors.push({ field: 'password', message: 'Password must be less than 128 characters', value: password });
  } else {
    // Password complexity: at least one lowercase, uppercase, number
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumber) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
        value: password
      });
    }
  }

  // Name validation (optional)
  if (name !== undefined && name !== null) {
    if (typeof name !== 'string') {
      errors.push({ field: 'name', message: 'Name must be a string', value: name });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be less than 100 characters', value: name });
    } else if (!/^[a-zA-Z0-9\s\s'-]+$/.test(name.replace(/\s+/g, ' ').trim())) {
      errors.push({ field: 'name', message: 'Name contains invalid characters', value: name });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

/**
 * Validate quest creation/update
 */
export const validateQuest = (req: Request, res: Response, next: NextFunction) => {
  const errors: Array<{ field: string; message: string; value: any }> = [];
  const { title, description, price, is_paid, duration_minutes } = req.body;

  // Title validation
  if (!title) {
    errors.push({ field: 'title', message: 'Title is required', value: title });
  } else if (typeof title !== 'string') {
    errors.push({ field: 'title', message: 'Title must be a string', value: title });
  } else if (title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Title must be at least 3 characters', value: title });
  } else if (title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be less than 200 characters', value: title });
  }

  // Description validation
  if (!description) {
    errors.push({ field: 'description', message: 'Description is required', value: description });
  } else if (typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string', value: description });
  } else if (description.length > 5000) {
    errors.push({ field: 'description', message: 'Description must be less than 5000 characters', value: description });
  }

  // Price validation
  if (price !== undefined && price !== null) {
    if (typeof price !== 'number' && typeof price !== 'string') {
      errors.push({ field: 'price', message: 'Price must be a number', value: price });
    } else {
      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
      if (isNaN(numericPrice) || numericPrice < 0) {
        errors.push({ field: 'price', message: 'Price must be a non-negative number', value: price });
      } else if (numericPrice > 999999) {
        errors.push({ field: 'price', message: 'Price must be less than 9,99,999', value: price });
      }
    }
  }

  // is_paid validation
  if (is_paid !== undefined && is_paid !== null) {
    if (typeof is_paid !== 'boolean' && is_paid !== 'true' && is_paid !== 'false') {
      errors.push({ field: 'is_paid', message: 'is_paid must be a boolean', value: is_paid });
    }
  }

  // Duration validation
  if (duration_minutes !== undefined && duration_minutes !== null) {
    if (typeof duration_minutes !== 'number' && typeof duration_minutes !== 'string') {
      errors.push({ field: 'duration_minutes', message: 'Duration must be a number', value: duration_minutes });
    } else {
      const numericDuration = typeof duration_minutes === 'string' ? parseInt(duration_minutes) : duration_minutes;
      if (isNaN(numericDuration) || numericDuration < 1) {
        errors.push({ field: 'duration_minutes', message: 'Duration must be at least 1 minute', value: duration_minutes });
      } else if (numericDuration > 1440) {
        errors.push({ field: 'duration_minutes', message: 'Duration must be less than 24 hours', value: duration_minutes });
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

/**
 * Validate question creation/update
 */
export const validateQuestion = (req: Request, res: Response, next: NextFunction) => {
  const errors: Array<{ field: string; message: string; value: any }> = [];
  const { question_text, options, correct_option_index, question_order } = req.body;

  // Question text validation
  if (!question_text) {
    errors.push({ field: 'question_text', message: 'Question text is required', value: question_text });
  } else if (typeof question_text !== 'string') {
    errors.push({ field: 'question_text', message: 'Question text must be a string', value: question_text });
  } else if (question_text.length > 2000) {
    errors.push({ field: 'question_text', message: 'Question text must be less than 2000 characters', value: question_text });
  }

  // Options validation
  if (!options || !Array.isArray(options)) {
    errors.push({ field: 'options', message: 'Options must be an array', value: options });
  } else if (options.length < 2) {
    errors.push({ field: 'options', message: 'At least 2 options are required', value: options });
  } else if (options.length > 10) {
    errors.push({ field: 'options', message: 'Maximum 10 options allowed', value: options });
  } else {
    options.forEach((option, index) => {
      if (typeof option !== 'string') {
        errors.push({ field: `options[${index}]`, message: 'Option must be a string', value: option });
      } else if (option.trim().length < 1) {
        errors.push({ field: `options[${index}]`, message: 'Option cannot be empty', value: option });
      } else if (option.length > 500) {
        errors.push({ field: `options[${index}]`, message: 'Option must be less than 500 characters', value: option });
      }
    });
  }

  // Correct option index validation
  if (options && Array.isArray(options)) {
    if (typeof correct_option_index !== 'number' && typeof correct_option_index !== 'undefined') {
      errors.push({ field: 'correct_option_index', message: 'Correct option index must be a number', value: correct_option_index });
    } else if (correct_option_index !== undefined && (correct_option_index < 0 || correct_option_index >= options.length)) {
      errors.push({ field: 'correct_option_index', message: 'Correct option index is out of bounds', value: correct_option_index });
    }
  }

  // Question order validation
  if (question_order !== undefined) {
    if (typeof question_order !== 'number') {
      errors.push({ field: 'question_order', message: 'Question order must be a number', value: question_order });
    } else if (question_order < 0) {
      errors.push({ field: 'question_order', message: 'Question order must be non-negative', value: question_order });
    } else if (question_order > 1000) {
      errors.push({ field: 'question_order', message: 'Question order must be less than 1000', value: question_order });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

/**
 * Validate quiz submission answers
 */
export const validateSubmission = (req: Request, res: Response, next: NextFunction) => {
  const errors: Array<{ field: string; message: string; value: any }> = [];
  const { quest_id, answers } = req.body;

  // Quest ID validation
  if (!quest_id) {
    errors.push({ field: 'quest_id', message: 'Quest ID is required', value: quest_id });
  } else if (typeof quest_id !== 'number' && typeof quest_id !== 'string') {
    errors.push({ field: 'quest_id', message: 'Quest ID must be a number', value: quest_id });
  } else {
    const numericId = typeof quest_id === 'string' ? parseInt(quest_id) : quest_id;
    if (isNaN(numericId) || numericId < 1) {
      errors.push({ field: 'quest_id', message: 'Quest ID must be a positive integer', value: quest_id });
    }
  }

  // Answers validation
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    errors.push({ field: 'answers', message: 'Answers must be an object', value: answers });
  } else {
    const questionIds = Object.keys(answers);
    if (questionIds.length === 0) {
      errors.push({ field: 'answers', message: 'At least one answer is required', value: answers });
    } else {
      Object.entries(answers).forEach(([questionId, answer]) => {
        const qid = typeof questionId === 'string' ? parseInt(questionId) : questionId;
        if (isNaN(qid) || qid < 0) {
          errors.push({ field: `answers[${questionId}]`, message: 'Question ID must be a positive integer', value: answer });
        }
        if (typeof answer !== 'number' && typeof answer !== 'undefined') {
          errors.push({ field: `answers[${questionId}]`, message: 'Answer must be a number (option index)', value: answer });
        }
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

/**
 * Validate payment request
 */
export const validatePayment = (req: Request, res: Response, next: NextFunction) => {
  const errors: Array<{ field: string; message: string; value: any }> = [];
  const { quest_id, amount } = req.body;

  // Quest ID validation
  if (!quest_id) {
    errors.push({ field: 'quest_id', message: 'Quest ID is required', value: quest_id });
  } else if (typeof quest_id !== 'number' && typeof quest_id !== 'string') {
    errors.push({ field: 'quest_id', message: 'Quest ID must be a number', value: quest_id });
  }

  // Amount validation
  if (!amount) {
    errors.push({ field: 'amount', message: 'Amount is required', value: amount });
  } else if (typeof amount !== 'number' && typeof amount !== 'string') {
    errors.push({ field: 'amount', message: 'Amount must be a number', value: amount });
  } else {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be a positive number', value: amount });
    } else if (numericAmount > 99999999) {
      errors.push({ field: 'amount', message: 'Amount exceeds maximum allowed value', value: amount });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Payment validation failed', errors });
  }

  next();
};

/**
 * Validate query parameters for quest listing
 */
export const validateQuestQuery = (req: Request, res: Response, next: NextFunction) => {
  const errors: Array<{ field: string; message: string; value: any }> = [];
  const { page, limit, search, is_paid } = req.query;

  // Page validation
  if (page !== undefined) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer', value: page });
    } else if (pageNum > 10000) {
      errors.push({ field: 'page', message: 'Page number too high', value: page });
    }
  }

  // Limit validation
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push({ field: 'limit', message: 'Limit must be a positive integer', value: limit });
    } else if (limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be at most 100', value: limit });
    }
  }

  // Search validation
  if (search !== undefined && typeof search === 'string' && search.length > 100) {
    errors.push({ field: 'search', message: 'Search query too long', value: search });
  }

  // is_paid validation
  if (is_paid !== undefined && typeof is_paid === 'string') {
    if (!['true', 'false', '1', '0'].includes(is_paid)) {
      errors.push({ field: 'is_paid', message: 'is_paid must be true or false', value: is_paid });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Query validation failed', errors });
  }

  next();
};
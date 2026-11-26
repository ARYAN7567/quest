import { Request, Response } from 'express';
import pool from '../config/database';
import crypto from 'crypto';
import { razorpay, razorpayConfig } from '../config/razorpay';
import { AuthRequest } from '../middleware/auth';

/**
 * Input validation for quest_id
 */
const validateQuestId = (questId: any): { valid: boolean; error?: string; numericId?: number } => {
  if (!questId) {
    return { valid: false, error: 'Quest ID is required' };
  }

  const numericId = typeof questId === 'string' ? parseInt(questId) : questId;

  if (isNaN(numericId)) {
    return { valid: false, error: 'Quest ID must be a valid number' };
  }

  if (numericId < 1) {
    return { valid: false, error: 'Quest ID must be a positive integer' };
  }

  if (numericId > 2147483647) { // Max 32-bit signed integer
    return { valid: false, error: 'Quest ID exceeds maximum allowed value' };
  }

  return { valid: true, numericId };
};

/**
 * Create Razorpay order
 * Creates a payment order for a paid quest
 */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { quest_id } = req.body;

    // Authentication check
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Validate quest_id
    const validation = validateQuestId(quest_id);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const numericQuestId = validation.numericId!;

    // Check if quest exists and is paid (parameterized query - SQL injection safe)
    const [quests] = await pool.query(
      'SELECT id, title, price, is_paid FROM quests WHERE id = ?',
      [numericQuestId]
    );
    // @ts-ignore
    const quest = quests[0];

    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    if (quest.is_paid !== 1 && quest.is_paid !== true) {
      return res.status(400).json({ message: 'This quest is free - no payment required' });
    }

    // Validate price
    const price = parseFloat(quest.price);
    if (isNaN(price) || price <= 0) {
      return res.status(500).json({ message: 'Invalid quest price' });
    }

    // Check if user already has access (prevent duplicate payments)
    const [access] = await pool.query(
      'SELECT id FROM user_quest_access WHERE user_id = ? AND quest_id = ?',
      [req.user.id, numericQuestId]
    );
    // @ts-ignore
    if (access.length > 0) {
      return res.status(400).json({ message: 'You already have access to this quest' });
    }

    // Create Razorpay order (amount in paise, rounded)
    const amount = Math.round(price * 100);

    // Validate amount
    if (amount > 75000000) { // Razorpay max: 7,500,000 paise
      return res.status(400).json({ message: 'Quest price exceeds maximum allowed amount' });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: razorpayConfig.currency,
      receipt: `quest_${numericQuestId}_user_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: req.user.id.toString(),
        quest_id: numericQuestId.toString()
      }
    });

    // Save pending payment to database
    await pool.query(
      'INSERT INTO payments (user_id, quest_id, razorpay_order_id, amount, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, numericQuestId, order.id, price, 'pending']
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayConfig.keyId,
      quest: { id: quest.id, title: quest.title, price: quest.price }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};
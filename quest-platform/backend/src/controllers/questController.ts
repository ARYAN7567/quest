import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Public: Get all quests
export const getQuests = async (req: Request, res: Response) => {
  try {
    const [quests] = await pool.query(
      `SELECT q.*,
        (SELECT COUNT(*) FROM questions WHERE quest_id = q.id) as question_count
       FROM quests q
       ORDER BY q.created_at DESC`
    );
    // @ts-ignore
    res.json({ quests });
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ message: 'Failed to fetch quests' });
  }
};

// Public: Get single quest with questions (for paid users)
export const getQuestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [quests] = await pool.query('SELECT * FROM quests WHERE id = ?', [id]);
    // @ts-ignore
    const quest = quests[0];

    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    // Check if user has access (if quest is paid)
    if (quest.is_paid && req.user) {
      const [access] = await pool.query(
        'SELECT * FROM user_quest_access WHERE user_id = ? AND quest_id = ?',
        [req.user.id, id]
      );
      // @ts-ignore
      if (access.length === 0) {
        return res.status(403).json({ message: 'Payment required to access this quest', requiresPayment: true });
      }
    } else if (quest.is_paid && !req.user) {
      return res.status(401).json({ message: 'Authentication required', requiresPayment: true });
    }

    // Get questions (hide correct answers)
    const [questions] = await pool.query(
      'SELECT id, question_text, options, question_order FROM questions WHERE quest_id = ? ORDER BY question_order',
      [id]
    );

    // @ts-ignore
    res.json({ quest, questions });
  } catch (error) {
    console.error('Get quest error:', error);
    res.status(500).json({ message: 'Failed to fetch quest' });
  }
};

// Admin: Create quest
export const createQuest = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, price, is_paid } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO quests (title, description, price, is_paid) VALUES (?, ?, ?, ?)`,
      [title, description || '', price || 0, is_paid !== false]
    );

    // @ts-ignore
    const questId = result.insertId;

    res.status(201).json({ message: 'Quest created', questId });
  } catch (error) {
    console.error('Create quest error:', error);
    res.status(500).json({ message: 'Failed to create quest' });
  }
};

// Admin: Update quest
export const updateQuest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, price, is_paid } = req.body;

    await pool.query(
      `UPDATE quests SET title = ?, description = ?, price = ?, is_paid = ? WHERE id = ?`,
      [title, description, price, is_paid, id]
    );

    res.json({ message: 'Quest updated' });
  } catch (error) {
    console.error('Update quest error:', error);
    res.status(500).json({ message: 'Failed to update quest' });
  }
};

// Admin: Delete quest
export const deleteQuest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM quests WHERE id = ?', [id]);

    res.json({ message: 'Quest deleted' });
  } catch (error) {
    console.error('Delete quest error:', error);
    res.status(500).json({ message: 'Failed to delete quest' });
  }
};

// Admin: Get all quests with stats
export const getAdminQuests = async (req: AuthRequest, res: Response) => {
  try {
    const [quests] = await pool.query(`
      SELECT q.*,
        (SELECT COUNT(*) FROM questions WHERE quest_id = q.id) as question_count,
        (SELECT COUNT(*) FROM user_quest_access WHERE quest_id = q.id) as enrolled_users,
        (SELECT COUNT(*) FROM submissions WHERE quest_id = q.id) as submissions_count
      FROM quests q
      ORDER BY q.created_at DESC
    `);

    // @ts-ignore
    res.json({ quests });
  } catch (error) {
    console.error('Get admin quests error:', error);
    res.status(500).json({ message: 'Failed to fetch quests' });
  }
};
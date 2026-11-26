import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Admin: Add question to quest
export const addQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { quest_id, question_text, options, correct_answer, question_order } = req.body;

    if (!quest_id || !question_text || !options || correct_answer === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'At least 2 options required' });
    }

    const [result] = await pool.query(
      `INSERT INTO questions (quest_id, question_text, options, correct_answer, question_order) VALUES (?, ?, ?, ?, ?)`,
      [quest_id, question_text, JSON.stringify(options), correct_answer, question_order || 0]
    );

    // @ts-ignore
    const questionId = result.insertId;

    res.status(201).json({ message: 'Question added', questionId });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ message: 'Failed to add question' });
  }
};

// Admin: Update question
export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question_text, options, correct_answer, question_order } = req.body;

    await pool.query(
      `UPDATE questions SET question_text = ?, options = ?, correct_answer = ?, question_order = ? WHERE id = ?`,
      [question_text, JSON.stringify(options), correct_answer, question_order || 0, id]
    );

    res.json({ message: 'Question updated' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Failed to update question' });
  }
};

// Admin: Delete question
export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM questions WHERE id = ?', [id]);

    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

// Admin: Get questions for a quest
export const getQuestQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { questId } = req.params;

    const [questions] = await pool.query(
      'SELECT * FROM questions WHERE quest_id = ? ORDER BY question_order',
      [questId]
    );

    // @ts-ignore
    const parsedQuestions = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    // @ts-ignore
    res.json({ questions: parsedQuestions });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
};

// Admin: Bulk add questions
export const bulkAddQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { quest_id, questions } = req.body;

    if (!quest_id || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Quest ID and questions array required' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const q of questions) {
        await connection.query(
          `INSERT INTO questions (quest_id, question_text, options, correct_answer, question_order) VALUES (?, ?, ?, ?, ?)`,
          [quest_id, q.question_text, JSON.stringify(q.options), q.correct_answer, q.question_order || 0]
        );
      }

      await connection.commit();
      res.status(201).json({ message: `${questions.length} questions added` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk add questions error:', error);
    res.status(500).json({ message: 'Failed to add questions' });
  }
};
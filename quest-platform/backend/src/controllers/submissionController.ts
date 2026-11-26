import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// User: Submit quest answers
export const submitAnswers = async (req: AuthRequest, res: Response) => {
  try {
    const { quest_id, answers } = req.body; // answers is an object { questionId: selectedOptionIndex }

    if (!req.user) return res.status(401).json({ message: 'Login required' });

    if (!quest_id || !answers) {
      return res.status(400).json({ message: 'Quest ID and answers are required' });
    }

    // Check if user already submitted
    const [existing] = await pool.query(
      'SELECT id FROM submissions WHERE user_id = ? AND quest_id = ?',
      [req.user.id, quest_id]
    );

    // @ts-ignore
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already submitted this quest' });
    }

    // Get correct answers
    const [questions] = await pool.query(
      'SELECT id, correct_answer FROM questions WHERE quest_id = ?',
      [quest_id]
    );

    // @ts-ignore
    const totalQuestions = questions.length;
    let correctAnswersCount = 0;

    // @ts-ignore
    for (const question of questions) {
      if (answers[question.id] !== undefined && answers[question.id] === question.correct_answer) {
        correctAnswersCount++;
      }
    }

    const score = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;

    await pool.query(
      `INSERT INTO submissions (user_id, quest_id, answers, score, total_questions, correct_answers)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, quest_id, JSON.stringify(answers), score, totalQuestions, correctAnswersCount]
    );

    res.status(201).json({
      message: 'Submission successful',
      score,
      totalQuestions,
      correctAnswersCount
    });
  } catch (error) {
    console.error('Submit answers error:', error);
    res.status(500).json({ message: 'Failed to submit answers' });
  }
};

// User/Admin: Get results and averages for a quest
export const getQuestAverages = async (req: Request, res: Response) => {
  try {
    const { questId } = req.params;

    // 1. Get total submissions
    const [submissions] = await pool.query(
      'SELECT id, answers, score FROM submissions WHERE quest_id = ?',
      [questId]
    );

    // @ts-ignore
    const totalSubmissions = submissions.length;

    if (totalSubmissions === 0) {
      return res.json({
        questId,
        totalSubmissions: 0,
        averageScore: 0,
        questionAverages: []
      });
    }

    // 2. Calculate average score
    // @ts-ignore
    const totalScore = submissions.reduce((sum, s) => sum + parseFloat(s.score), 0);
    const averageScore = totalScore / totalSubmissions;

    // 3. Calculate per-question correctness percentage (averages)
    const [questions] = await pool.query(
      'SELECT id, question_text, correct_answer FROM questions WHERE quest_id = ?',
      [questId]
    );

    // @ts-ignore
    const questionStats = questions.map(q => {
      let correctCount = 0;
      // @ts-ignore
      submissions.forEach(s => {
        const userAnswers = typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers;
        if (userAnswers[q.id] !== undefined && userAnswers[q.id] === q.correct_answer) {
          correctCount++;
        }
      });

      return {
        questionId: q.id,
        questionText: q.question_text,
        correctPercentage: (correctCount / totalSubmissions) * 100
      };
    });

    res.json({
      questId,
      totalSubmissions,
      averageScore,
      questionAverages: questionStats
    });
  } catch (error) {
    console.error('Get averages error:', error);
    res.status(500).json({ message: 'Failed to fetch averages' });
  }
};

// User: Get their own result for a quest
export const getUserSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { questId } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Login required' });

    const [submissions] = await pool.query(
      'SELECT * FROM submissions WHERE user_id = ? AND quest_id = ?',
      [req.user.id, questId]
    );

    // @ts-ignore
    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // @ts-ignore
    res.json({ submission: submissions[0] });
  } catch (error) {
    console.error('Get user submission error:', error);
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
};
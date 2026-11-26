import pool from '../config/database';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  const connection = await pool.getConnection();
  try {
    console.log('Seeding database...');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    await connection.query(
      `INSERT IGNORE INTO users (email, password, role, name) VALUES (?, ?, ?, ?)`,
      ['admin@quest.com', hashedPassword, 'admin', 'Admin User']
    );

    // Create sample quest
    const [questResult] = await connection.query(
      `INSERT IGNORE INTO quests (title, description, price, is_paid) VALUES (?, ?, ?, ?)`,
      ['JavaScript Fundamentals Quest', 'Test your JavaScript knowledge', 299.00, true]
    );

    // @ts-ignore
    const questId = questResult.insertId;

    if (questId) {
      // Add sample questions
      const questions = [
        {
          quest_id: questId,
          question_text: 'What is the output of: console.log(typeof null)?',
          options: JSON.stringify(['null', 'undefined', 'object', 'string']),
          correct_answer: 2,
          question_order: 1,
        },
        {
          quest_id: questId,
          question_text: 'Which method adds an element to the end of an array?',
          options: JSON.stringify(['push()', 'pop()', 'shift()', 'unshift()']),
          correct_answer: 0,
          question_order: 2,
        },
        {
          quest_id: questId,
          question_text: 'What does === operator do?',
          options: JSON.stringify(['Assigns value', 'Compares value only', 'Compares value and type', 'Concatenates strings']),
          correct_answer: 2,
          question_order: 3,
        },
        {
          quest_id: questId,
          question_text: 'How to declare a constant in JavaScript?',
          options: JSON.stringify(['var', 'let', 'const', 'constant']),
          correct_answer: 2,
          question_order: 4,
        },
        {
          quest_id: questId,
          question_text: 'Which of these is a JavaScript framework?',
          options: JSON.stringify(['Django', 'React', 'Laravel', 'Flask']),
          correct_answer: 1,
          question_order: 5,
        },
      ];

      for (const q of questions) {
        await connection.query(
          `INSERT IGNORE INTO questions (quest_id, question_text, options, correct_answer, question_order) VALUES (?, ?, ?, ?, ?)`,
          [q.quest_id, q.question_text, q.options, q.correct_answer, q.question_order]
        );
      }
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
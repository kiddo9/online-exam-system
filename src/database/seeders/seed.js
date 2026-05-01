const bcrypt = require('bcryptjs');
const db = require('../../config/db');
require('dotenv').config();

async function seed() {
    try {
        console.log('Starting seeding...');

        // 1. Clear existing data (Optional, be careful in production)
        // await db.query('TRUNCATE users, exams, submissions RESTART IDENTITY CASCADE');

        // 2. Create Admin
        const adminPass = await bcrypt.hash('admin123', 10);
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
            ['System Admin', 'admin@exampro.com', adminPass, 'admin']
        );
        console.log('Admin user seeded: admin@exampro.com / admin123');

        // 3. Create Student
        const studentPass = await bcrypt.hash('student123', 10);
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
            ['John Student', 'student@exampro.com', studentPass, 'student']
        );
        console.log('Student user seeded: student@exampro.com / student123');

        // 4. Create a Sample Exam
        const examResult = await db.query(
            'INSERT INTO exams (title, duration, is_published) VALUES ($1, $2, $3) RETURNING id',
            ['General Knowledge Quiz', 10, true]
        );
        const examId = examResult.rows[0].id;
        console.log('Sample exam seeded');

        // 5. Create Sample Questions
        const q1 = await db.query(
            'INSERT INTO questions (exam_id, question_text) VALUES ($1, $2) RETURNING id',
            [examId, 'What is the capital of France?']
        );
        const q1Id = q1.rows[0].id;
        await db.query('INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [q1Id, 'London', false]);
        await db.query('INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [q1Id, 'Berlin', false]);
        await db.query('INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [q1Id, 'Paris', true]);
        await db.query('INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [q1Id, 'Madrid', false]);

        const q2 = await db.query(
            'INSERT INTO questions (exam_id, question_text) VALUES ($1, $2) RETURNING id',
            [examId, 'Which planet is known as the Red Planet?']
        );
        const q2Id = q2.rows[0].id;
        await db.query('INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [q2Id, 'Venus', false]);
        await db.query('INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [q2Id, 'Mars', true]);
        await db.query('INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [q2Id, 'Jupiter', false]);
        await db.query('INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [q2Id, 'Saturn', false]);

        console.log('Questions and options seeded');
        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();

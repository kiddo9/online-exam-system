const db = require('../config/db');

exports.addQuestion = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { question_text, options } = req.body; // options: [{text, is_correct}]

    await db.query('BEGIN');

    const question = await db.query(
      'INSERT INTO questions (exam_id, question_text) VALUES ($1, $2) RETURNING id',
      [examId, question_text]
    );
    const questionId = question.rows[0].id;

    for (const option of options) {
      await db.query(
        'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
        [questionId, option.text || option.option_text, option.is_correct]
      );
    }

    await db.query('COMMIT');

    res.status(201).json({ message: 'Question added successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExamQuestions = async (req, res) => {
  try {
    const { id: examId } = req.params;

    const questions = await db.query(
      'SELECT id, question_text FROM questions WHERE exam_id = $1',
      [examId]
    );

    const questionsWithOptions = [];

    for (const q of questions.rows) {
      const options = await db.query(
        'SELECT id, option_text, is_correct FROM options WHERE question_id = $1',
        [q.id]
      );
      
      // If student, don't send is_correct
      const sanitizedOptions = options.rows.map(opt => {
        if (req.user.role === 'student') {
          const { is_correct, ...rest } = opt;
          return rest;
        }
        return opt;
      });

      questionsWithOptions.push({
        ...q,
        options: sanitizedOptions
      });
    }

    res.json(questionsWithOptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

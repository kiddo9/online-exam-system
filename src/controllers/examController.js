const db = require('../config/db');

exports.getAllExams = async (req, res) => {
  try {
    let query;
    let params = [];
    if (req.user.role === 'admin') {
      query = 'SELECT * FROM exams ORDER BY created_at DESC';
    } else {
      // For students, check if they have already submitted
      query = `
        SELECT e.*, 
        EXISTS (SELECT 1 FROM submissions s WHERE s.exam_id = e.id AND s.user_id = $1) as is_submitted
        FROM exams e
        WHERE e.is_published = TRUE 
        ORDER BY e.created_at DESC`;
      params = [req.user.id];
    }
    const exams = await db.query(query, params);
    res.json(exams.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await db.query('SELECT * FROM exams WHERE id = $1', [id]);
    
    if (exam.rows.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { title, duration } = req.body;
    const newExam = await db.query(
      'INSERT INTO exams (title, duration) VALUES ($1, $2) RETURNING *',
      [title, duration]
    );
    res.status(201).json(newExam.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.publishExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;
    const updatedExam = await db.query(
      'UPDATE exams SET is_published = $1 WHERE id = $2 RETURNING *',
      [is_published, id]
    );
    res.json(updatedExam.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.startExam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if exam exists and is published
    const exam = await db.query('SELECT * FROM exams WHERE id = $1 AND is_published = TRUE', [id]);
    if (exam.rows.length === 0) {
      return res.status(404).json({ message: 'Exam not found or not published' });
    }

    // Check if student already submitted
    const submission = await db.query('SELECT * FROM submissions WHERE user_id = $1 AND exam_id = $2', [userId, id]);
    if (submission.rows.length > 0) {
      return res.status(400).json({ message: 'You have already attempted this exam' });
    }

    res.json({ message: 'Exam started', exam: exam.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.submitExam = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body; // Array of { questionId, selectedOptionId }

    // Check if already submitted
    const existingSubmission = await db.query('SELECT * FROM submissions WHERE user_id = $1 AND exam_id = $2', [userId, examId]);
    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({ message: 'Already submitted' });
    }

    // Fetch correct options for all questions in this exam
    const correctOptions = await db.query(
      `SELECT q.id as question_id, o.id as option_id 
       FROM questions q 
       JOIN options o ON q.id = o.question_id 
       WHERE q.exam_id = $1 AND o.is_correct = TRUE`,
      [examId]
    );

    const correctMap = {};
    correctOptions.rows.forEach(row => {
      correctMap[row.question_id] = row.option_id;
    });

    let score = 0;
    const totalQuestions = Object.keys(correctMap).length;

    // Start a transaction
    await db.query('BEGIN');

    // Create submission
    const submission = await db.query(
      'INSERT INTO submissions (user_id, exam_id) VALUES ($1, $2) RETURNING id',
      [userId, examId]
    );
    const submissionId = submission.rows[0].id;

    // Calculate score and save answers
    for (const ans of answers) {
      if (correctMap[ans.questionId] === ans.selectedOptionId) {
        score++;
      }
      await db.query(
        'INSERT INTO answers (submission_id, question_id, selected_option_id) VALUES ($1, $2, $3)',
        [submissionId, ans.questionId, ans.selectedOptionId]
      );
    }

    // Update score in submission (as percentage)
    const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    await db.query('UPDATE submissions SET score = $1 WHERE id = $2', [scorePercentage, submissionId]);

    await db.query('COMMIT');

    res.json({ 
      message: 'Exam submitted successfully', 
      score: scorePercentage, 
      total: 100,
      submissionId: submissionId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

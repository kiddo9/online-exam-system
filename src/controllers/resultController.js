const db = require('../config/db');

exports.getMyResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const results = await db.query(
      `SELECT s.*, e.title as exam_title, e.duration 
       FROM submissions s 
       JOIN exams e ON s.exam_id = e.id 
       WHERE s.user_id = $1 
       ORDER BY s.submitted_at DESC`,
      [userId]
    );
    res.json(results.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const results = await db.query(
      `SELECT s.*, e.title as exam_title, u.name as user_name, u.email as user_email 
       FROM submissions s 
       JOIN exams e ON s.exam_id = e.id 
       JOIN users u ON s.user_id = u.id 
       ORDER BY s.submitted_at DESC`
    );
    res.json(results.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSubmissionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`[ResultController] getSubmissionDetails called for ID: ${id}, User: ${userId}`);

    // Check if submission exists and belongs to user (or if admin)
    const submissionResult = await db.query(
      `SELECT s.*, e.title as exam_title, e.duration 
       FROM submissions s 
       JOIN exams e ON s.exam_id = e.id 
       WHERE s.id = $1`,
      [id]
    );

    if (submissionResult.rows.length === 0) {
      console.log(`Submission ${id} not found`);
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submission = submissionResult.rows[0];

    // Ensure comparison works regardless of type (string vs number)
    if (req.user.role !== 'admin' && String(submission.user_id) !== String(userId)) {
      console.log(`User ${userId} not authorized for submission ${id} (owned by ${submission.user_id})`);
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }

    // Fetch questions and answers for this submission
    // Use LEFT JOIN for o_corr to avoid excluding questions that might not have a correct answer set
    const reviewResult = await db.query(
      `SELECT q.id as question_id, q.question_text, 
              a.selected_option_id,
              o_sel.option_text as selected_option_text,
              o_corr.id as correct_option_id,
              o_corr.option_text as correct_option_text
       FROM questions q
       LEFT JOIN answers a ON q.id = a.question_id AND a.submission_id = $1
       LEFT JOIN options o_sel ON a.selected_option_id = o_sel.id
       LEFT JOIN options o_corr ON q.id = o_corr.question_id AND o_corr.is_correct = TRUE
       WHERE q.exam_id = $2`,
      [id, submission.exam_id]
    );

    // Fetch all options for these questions to show in review
    const allOptionsResult = await db.query(
      `SELECT o.id, o.question_id, o.option_text, o.is_correct
       FROM options o
       JOIN questions q ON o.question_id = q.id
       WHERE q.exam_id = $1`,
      [submission.exam_id]
    );

    const questionsWithReview = reviewResult.rows.map(q => ({
      ...q,
      options: allOptionsResult.rows.filter(o => o.question_id === q.question_id)
    }));

    res.json({
      submission,
      review: questionsWithReview
    });
  } catch (error) {
    console.error('Error in getSubmissionDetails:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

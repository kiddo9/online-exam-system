const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const examRoutes = require('./src/routes/examRoutes');
const resultRoutes = require('./src/routes/resultRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);

// JSON 404 handler for API routes
app.use('/api', (req, res) => {
  console.log(`API 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

app.use(express.static('public'));

// Basic route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

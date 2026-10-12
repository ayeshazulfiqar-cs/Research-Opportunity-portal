require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const opportunities = require('./routes/opportunities');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// REST API
app.use('/api/opportunities', opportunities);

// Unknown API route -> 404 (JSON)
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Frontend (static files)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Error handler: malformed JSON -> 400, everything else -> 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Validation failed.', errors: ['Request body is not valid JSON.'] });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`Research Opportunity Portal running at http://localhost:${PORT}`);
});

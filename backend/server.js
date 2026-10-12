// Research Opportunity Portal - backend (Express + MySQL)
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend'))); // serves the frontend

// Database connection (settings come from the .env file)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'research_portal',
  dateStrings: true, // dates come back as 'YYYY-MM-DD' text
});

const TEXT_FIELDS = ['title', 'description', 'research_area', 'faculty_name', 'department', 'required_skills'];

// Checks the data. Returns { errors, data }.
// For an update (isUpdate = true) only the fields that were sent are checked.
function validate(body, isUpdate) {
  const errors = [];
  const data = {};

  for (const field of TEXT_FIELDS) {
    if (body[field] === undefined) {
      if (!isUpdate) errors.push(field + ' is required');
    } else if (typeof body[field] !== 'string' || body[field].trim() === '') {
      errors.push(field + ' must be non-empty text');
    } else {
      data[field] = body[field].trim();
    }
  }

  if (body.available_positions === undefined) {
    if (!isUpdate) errors.push('available_positions is required');
  } else if (!Number.isInteger(Number(body.available_positions)) || Number(body.available_positions) < 1) {
    errors.push('available_positions must be a whole number of 1 or more');
  } else {
    data.available_positions = Number(body.available_positions);
  }

  if (body.application_deadline === undefined) {
    if (!isUpdate) errors.push('application_deadline is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(body.application_deadline) || isNaN(new Date(body.application_deadline))) {
    errors.push('application_deadline must be a valid date (YYYY-MM-DD)');
  } else {
    data.application_deadline = body.application_deadline;
  }

  if (body.status === undefined) {
    if (!isUpdate) data.status = 'Open';
  } else if (body.status !== 'Open' && body.status !== 'Closed') {
    errors.push("status must be 'Open' or 'Closed'");
  } else {
    data.status = body.status;
  }

  if (isUpdate && errors.length === 0 && Object.keys(data).length === 0) {
    errors.push('Send at least one field to update');
  }
  return { errors, data };
}

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

// 1. Create a research opportunity
app.post('/api/opportunities', async (req, res) => {
  const { errors, data } = validate(req.body, false);
  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  try {
    const [result] = await db.query('INSERT INTO opportunities SET ?', [data]);
    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. Get all research opportunities
app.get('/api/opportunities', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM opportunities ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. Get one research opportunity
app.get('/api/opportunities/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Validation failed', errors: ['id must be a positive number'] });
  try {
    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Opportunity not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. Update a research opportunity (also used to change the status to Closed)
app.put('/api/opportunities/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Validation failed', errors: ['id must be a positive number'] });
  const { errors, data } = validate(req.body, true);
  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  try {
    const [result] = await db.query('UPDATE opportunities SET ? WHERE id = ?', [data, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Opportunity not found' });
    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. Delete a research opportunity
app.delete('/api/opportunities/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Validation failed', errors: ['id must be a positive number'] });
  try {
    const [result] = await db.query('DELETE FROM opportunities WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Opportunity not found' });
    res.status(200).json({ message: 'Opportunity deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Bad JSON in the request body -> 400
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Validation failed', errors: ['Request body is not valid JSON'] });
  }
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running at http://localhost:' + PORT));

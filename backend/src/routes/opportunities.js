const express = require('express');
const pool = require('../db');
const { validateOpportunity, parseId } = require('../validation');

const router = express.Router();

const COLUMNS = `id, title, description, research_area, faculty_name, department,
  required_skills, available_positions, application_deadline, status, created_at, updated_at`;

// Wrap async handlers so rejected promises reach the error middleware (-> 500).
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const badRequest = (res, errors) =>
  res.status(400).json({ message: 'Validation failed.', errors });

const notFound = (res, id) =>
  res.status(404).json({ message: `Research opportunity with ID ${id} was not found.` });

// 1. CREATE  - POST /api/opportunities
router.post('/', wrap(async (req, res) => {
  const { errors, data } = validateOpportunity(req.body, false);
  if (errors.length) return badRequest(res, errors);

  const [result] = await pool.query('INSERT INTO opportunities SET ?', [data]);
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM opportunities WHERE id = ?`, [result.insertId]);
  res.status(201).json(rows[0]);
}));

// 2. READ ALL - GET /api/opportunities
router.get('/', wrap(async (req, res) => {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM opportunities ORDER BY id DESC`);
  res.status(200).json(rows);
}));

// 3. READ ONE - GET /api/opportunities/:id
router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return badRequest(res, ['ID must be a positive whole number.']);

  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM opportunities WHERE id = ?`, [id]);
  if (rows.length === 0) return notFound(res, id);
  res.status(200).json(rows[0]);
}));

// 4. UPDATE - PUT /api/opportunities/:id  (also used to change status Open -> Closed)
router.put('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return badRequest(res, ['ID must be a positive whole number.']);

  const { errors, data } = validateOpportunity(req.body, true);
  if (errors.length) return badRequest(res, errors);

  const [result] = await pool.query('UPDATE opportunities SET ? WHERE id = ?', [data, id]);
  if (result.affectedRows === 0) return notFound(res, id);

  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM opportunities WHERE id = ?`, [id]);
  res.status(200).json(rows[0]);
}));

// 5. DELETE - DELETE /api/opportunities/:id
router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return badRequest(res, ['ID must be a positive whole number.']);

  const [result] = await pool.query('DELETE FROM opportunities WHERE id = ?', [id]);
  if (result.affectedRows === 0) return notFound(res, id);
  res.status(200).json({ message: `Research opportunity with ID ${id} was deleted.` });
}));

module.exports = router;

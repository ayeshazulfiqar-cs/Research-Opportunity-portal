const STATUSES = ['Open', 'Closed'];

// field name -> { label, max length }
const TEXT_FIELDS = {
  title: { label: 'Research title', max: 200 },
  description: { label: 'Research description', max: 5000 },
  research_area: { label: 'Research area', max: 100 },
  faculty_name: { label: "Faculty member's name", max: 100 },
  department: { label: 'Department', max: 100 },
  required_skills: { label: 'Required skills', max: 500 },
};

const ALL_FIELDS = [
  ...Object.keys(TEXT_FIELDS),
  'available_positions',
  'application_deadline',
  'status',
];

function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Validate a request body.
 * @param {object} body
 * @param {boolean} partial  true for PUT (only provided fields are checked)
 * @returns {{errors: string[], data: object}}
 */
function validateOpportunity(body, partial = false) {
  const errors = [];
  const data = {};

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object.'], data };
  }

  for (const [field, { label, max }] of Object.entries(TEXT_FIELDS)) {
    if (body[field] === undefined) {
      if (!partial) errors.push(`${label} is required.`);
      continue;
    }
    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      errors.push(`${label} must be a non-empty text value.`);
    } else if (body[field].trim().length > max) {
      errors.push(`${label} must be at most ${max} characters.`);
    } else {
      data[field] = body[field].trim();
    }
  }

  if (body.available_positions === undefined) {
    if (!partial) errors.push('Number of available positions is required.');
  } else {
    const n = body.available_positions;
    if (typeof n === 'boolean' || n === null || n === '' || !Number.isInteger(Number(n)) || Number(n) < 1 || Number(n) > 1000) {
      errors.push('Number of available positions must be a whole number between 1 and 1000.');
    } else {
      data.available_positions = Number(n);
    }
  }

  if (body.application_deadline === undefined) {
    if (!partial) errors.push('Application deadline is required.');
  } else if (!isRealDate(body.application_deadline)) {
    errors.push('Application deadline must be a valid date in YYYY-MM-DD format.');
  } else {
    data.application_deadline = body.application_deadline;
  }

  if (body.status === undefined) {
    if (!partial) data.status = 'Open'; // default for new opportunities
  } else if (!STATUSES.includes(body.status)) {
    errors.push("Status must be either 'Open' or 'Closed'.");
  } else {
    data.status = body.status;
  }

  if (partial && errors.length === 0 && Object.keys(data).length === 0) {
    errors.push(`Provide at least one field to update: ${ALL_FIELDS.join(', ')}.`);
  }

  return { errors, data };
}

function parseId(raw) {
  return /^[1-9]\d*$/.test(raw) ? Number(raw) : null;
}

module.exports = { validateOpportunity, parseId };

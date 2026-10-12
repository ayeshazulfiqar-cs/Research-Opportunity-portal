// Frontend for the Research Opportunity Portal.
// All data comes from the backend REST API - nothing is hard-coded here.
const API = '/api/opportunities';
const FIELDS = ['title', 'description', 'research_area', 'faculty_name', 'department',
                'required_skills', 'available_positions', 'application_deadline', 'status'];
let editingId = null; // null = creating a new one, a number = updating that one

const $ = (id) => document.getElementById(id);

// Make text safe to put into HTML
function safe(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Show a success or error message at the top
function showMessage(text, type) {
  $('message').textContent = text;
  $('message').className = type;
}

// Send a request to the API and return { ok, status, data }
async function callApi(url, options) {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data: data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: 'Cannot reach the server. Is the backend running?' } };
  }
}

// Turn an API error into readable text
function errorText(result) {
  if (result.data.errors) return result.data.errors.join(', ');
  return result.data.message;
}

// 1. Display all opportunities
async function loadList() {
  const result = await callApi(API);
  if (!result.ok) return showMessage(errorText(result), 'error');

  const rows = result.data.map((o) => `
    <tr>
      <td>${safe(o.title)}</td>
      <td>${safe(o.faculty_name)}</td>
      <td>${safe(o.application_deadline)}</td>
      <td class="${o.status.toLowerCase()}">${o.status}</td>
      <td><button onclick="viewOpportunity(${o.id})">View</button></td>
    </tr>`);
  $('list').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5">No opportunities yet. Click "New opportunity" to add one.</td></tr>';
}

// 2. Display the full details of one opportunity
async function viewOpportunity(id) {
  const result = await callApi(API + '/' + id);
  if (!result.ok) {
    showMessage(errorText(result), 'error');
    $('details').hidden = true;
    loadList();
    return;
  }
  const o = result.data;
  $('details').hidden = false;
  $('details').innerHTML = `
    <h2>${safe(o.title)}</h2>
    <p>${safe(o.description)}</p>
    <p><b>Research area:</b> ${safe(o.research_area)}</p>
    <p><b>Faculty member:</b> ${safe(o.faculty_name)}</p>
    <p><b>Department:</b> ${safe(o.department)}</p>
    <p><b>Required skills:</b> ${safe(o.required_skills)}</p>
    <p><b>Available positions:</b> ${o.available_positions}</p>
    <p><b>Application deadline:</b> ${safe(o.application_deadline)}</p>
    <p><b>Status:</b> <span class="${o.status.toLowerCase()}">${o.status}</span></p>
    <button onclick="editOpportunity(${o.id})">Edit</button>
    ${o.status === 'Open' ? `<button onclick="closeOpportunity(${o.id})">Close opportunity</button>` : ''}
    <button onclick="deleteOpportunity(${o.id})">Delete</button>`;
}

// 3 and 4. Show the form (empty for a new one, filled in for an update)
function openForm(opportunity) {
  editingId = opportunity ? opportunity.id : null;
  $('formTitle').textContent = opportunity ? 'Update opportunity' : 'New opportunity';
  $('formErrors').textContent = '';
  for (const f of FIELDS) {
    $(f).value = opportunity ? opportunity[f] : (f === 'status' ? 'Open' : '');
  }
  $('form').hidden = false;
  $('title').focus();
}

async function editOpportunity(id) {
  const result = await callApi(API + '/' + id);
  if (!result.ok) return showMessage(errorText(result), 'error');
  openForm(result.data);
}

// Basic validation of the required fields
function checkForm() {
  const problems = [];
  for (const f of FIELDS) {
    if ($(f).value.trim() === '') problems.push(f.replace(/_/g, ' ') + ' is required');
  }
  if ($('available_positions').value !== '' && Number($('available_positions').value) < 1) {
    problems.push('available positions must be at least 1');
  }
  return problems;
}

// Save the form (create or update)
async function saveForm(event) {
  event.preventDefault();
  const problems = checkForm();
  if (problems.length > 0) {
    $('formErrors').textContent = problems.join('. ') + '.';
    return;
  }
  $('formErrors').textContent = '';

  const body = {};
  for (const f of FIELDS) body[f] = $(f).value.trim();
  body.available_positions = Number(body.available_positions);

  const url = editingId ? API + '/' + editingId : API;
  const result = await callApi(url, {
    method: editingId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!result.ok) return showMessage(errorText(result), 'error');

  showMessage(editingId ? 'Opportunity updated.' : 'Opportunity created.', 'success');
  $('form').hidden = true;
  await loadList();
  viewOpportunity(result.data.id);
}

// 5. Change the status from Open to Closed
async function closeOpportunity(id) {
  const result = await callApi(API + '/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Closed' }),
  });
  if (!result.ok) return showMessage(errorText(result), 'error');
  showMessage('Opportunity closed.', 'success');
  await loadList();
  viewOpportunity(id);
}

// 6. Delete an opportunity
async function deleteOpportunity(id) {
  if (!confirm('Delete this opportunity? This cannot be undone.')) return;
  const result = await callApi(API + '/' + id, { method: 'DELETE' });
  if (!result.ok) return showMessage(errorText(result), 'error');
  showMessage('Opportunity deleted.', 'success');
  $('details').hidden = true;
  loadList();
}

$('newBtn').addEventListener('click', () => openForm(null));
$('cancelBtn').addEventListener('click', () => { $('form').hidden = true; });
$('form').addEventListener('submit', saveForm);

loadList();

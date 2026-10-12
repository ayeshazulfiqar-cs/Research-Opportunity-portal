'use strict';

/* ---------- Configuration ---------- */
// Served by the backend -> same origin. Opened directly from disk -> talk to localhost:3000.
const API = location.protocol === 'file:'
  ? 'http://localhost:3000/api/opportunities'
  : '/api/opportunities';

const FIELDS = [
  { name: 'title', label: 'Research title', type: 'text', max: 200, full: true },
  { name: 'description', label: 'Research description', type: 'textarea', max: 5000, full: true },
  { name: 'research_area', label: 'Research area', type: 'text', max: 100 },
  { name: 'department', label: 'Department', type: 'text', max: 100 },
  { name: 'faculty_name', label: "Faculty member's name", type: 'text', max: 100 },
  { name: 'available_positions', label: 'Available positions', type: 'number' },
  { name: 'required_skills', label: 'Required skills', type: 'text', max: 500, full: true, help: 'Separate skills with commas, e.g. Python, statistics, lab safety.' },
  { name: 'application_deadline', label: 'Application deadline', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'] },
];

/* ---------- State ---------- */
const state = { items: [], filter: 'All', selectedId: null };

/* ---------- DOM helpers ---------- */
const $ = (sel) => document.querySelector(sel);

// Build elements safely (text is never parsed as HTML).
function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function deadlineNote(item) {
  const [y, m, d] = item.application_deadline.split('-').map(Number);
  const days = Math.round((new Date(y, m - 1, d) - new Date(new Date().toDateString())) / 86400000);
  if (item.status === 'Closed') return '';
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Due today';
  return days === 1 ? '1 day left' : `${days} days left`;
}

const badge = (status) => h('span', { class: `badge badge-${status.toLowerCase()}` }, status);

/* ---------- Toasts ---------- */
function toast(message, kind = 'success') {
  const node = h('div', { class: `toast toast-${kind}`, role: kind === 'error' ? 'alert' : 'status' },
    h('span', {}, message),
    h('button', { type: 'button', 'aria-label': 'Dismiss message', onclick: () => node.remove() }, '×'));
  $('#toasts').append(node);
  setTimeout(() => node.remove(), kind === 'error' ? 7000 : 4000);
}

/* ---------- API wrapper ---------- */
async function api(path = '', options = {}) {
  try {
    const res = await fetch(API + path, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* empty or non-JSON body */ }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { message: 'Cannot reach the server. Check that the backend is running and try again.' } };
  }
}

function errorMessage(res) {
  if (res.data && Array.isArray(res.data.errors) && res.data.errors.length) return res.data.errors.join(' ');
  return (res.data && res.data.message) || `Something went wrong (status ${res.status}).`;
}

/* ---------- List ---------- */
async function loadList() {
  const list = $('#list');
  list.replaceChildren(h('p', { class: 'loading' }, 'Loading opportunities…'));
  const res = await api();
  if (!res.ok) {
    list.replaceChildren(h('div', { class: 'notice' }, errorMessage(res),
      h('div', {}, h('button', { type: 'button', class: 'btn', onclick: loadList }, 'Try again'))));
    $('#count').textContent = '';
    return;
  }
  state.items = res.data;
  renderList();
}

function renderList() {
  const list = $('#list');
  const visible = state.items.filter((i) => state.filter === 'All' || i.status === state.filter);
  $('#count').textContent = `(${visible.length})`;

  if (state.items.length === 0) {
    list.replaceChildren(h('div', { class: 'panel-empty' },
      h('p', {}, 'No research opportunities have been posted yet. Post the first one to get started.')));
    return;
  }
  if (visible.length === 0) {
    list.replaceChildren(h('p', { class: 'loading' }, `No ${state.filter.toLowerCase()} opportunities right now.`));
    return;
  }

  list.replaceChildren(...visible.map((item) => {
    const note = deadlineNote(item);
    return h('button', {
      type: 'button',
      class: `card${item.status === 'Closed' ? ' is-closed' : ''}${item.id === state.selectedId ? ' is-selected' : ''}`,
      'aria-current': item.id === state.selectedId ? 'true' : false,
      onclick: () => showDetail(item.id),
    },
      h('div', { class: 'card-title' }, item.title),
      h('div', { class: 'card-meta' }, `${item.faculty_name}, ${item.department}`),
      h('div', { class: 'card-foot' },
        badge(item.status),
        h('span', {}, note ? `${note}, ` : '', `${item.available_positions} ${item.available_positions === 1 ? 'position' : 'positions'}`)));
  }));
}

/* ---------- Panel views ---------- */
function setPanel(...nodes) {
  const panel = $('#panel');
  panel.replaceChildren(...nodes);
  return panel;
}

function showEmptyPanel() {
  state.selectedId = null;
  renderList();
  setPanel(h('div', { class: 'panel-empty' },
    h('h2', {}, 'Select an opportunity'),
    h('p', {}, 'Choose one from the list to see its full details, or post a new research opportunity.'),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => showForm() }, 'Post opportunity')));
}

async function showDetail(id) {
  state.selectedId = id;
  renderList();
  setPanel(h('p', { class: 'loading' }, 'Loading details…'));
  const res = await api(`/${id}`);

  if (!res.ok) {
    if (res.status === 404) {
      toast(errorMessage(res), 'error');
      await loadList();
      state.selectedId = null;
      renderList();
    }
    setPanel(h('div', { class: 'notice' },
      res.status === 404 ? 'This opportunity no longer exists. It may have been deleted.' : errorMessage(res),
      h('div', {}, h('button', { type: 'button', class: 'btn', onclick: loadList }, 'Refresh list'))));
    return;
  }

  const item = res.data;
  const closeBtn = item.status === 'Open'
    ? h('button', { type: 'button', class: 'btn', onclick: (e) => changeStatus(item, 'Closed', e.currentTarget) }, 'Close opportunity')
    : h('button', { type: 'button', class: 'btn', onclick: (e) => changeStatus(item, 'Open', e.currentTarget) }, 'Reopen opportunity');

  const fact = (term, value) => h('div', {}, h('dt', {}, term), h('dd', {}, value));
  const note = deadlineNote(item);

  setPanel(
    h('div', { class: 'detail-head' }, h('h2', {}, item.title), badge(item.status)),
    h('p', { class: 'detail-sub' }, `${item.faculty_name}, ${item.department}`),
    h('p', { class: 'detail-desc' }, item.description),
    h('dl', { class: 'facts' },
      fact('Research area', item.research_area),
      fact('Required skills', item.required_skills),
      fact('Available positions', item.available_positions),
      fact('Application deadline', formatDate(item.application_deadline) + (note ? ` (${note.toLowerCase()})` : '')),
      fact('Last updated', item.updated_at)),
    h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'btn btn-primary', onclick: () => showForm(item) }, 'Edit'),
      closeBtn,
      h('span', { class: 'spacer' }),
      h('button', { type: 'button', class: 'btn btn-outline-danger', onclick: () => confirmDelete(item) }, 'Delete')))
    .focus();
}

/* ---------- Form (create + edit) ---------- */
function showForm(item = null) {
  const editing = item !== null;
  if (!editing) { state.selectedId = null; renderList(); }

  const summary = h('div', { class: 'notice form-error-summary', role: 'alert', hidden: true });
  const form = h('form', { class: 'form', novalidate: true });
  const grid = h('div', { class: 'form-grid' });

  for (const f of FIELDS) {
    const id = `f-${f.name}`;
    const value = editing ? item[f.name] : (f.name === 'status' ? 'Open' : '');
    let control;
    if (f.type === 'textarea') control = h('textarea', { id, name: f.name, maxlength: f.max });
    else if (f.type === 'select') control = h('select', { id, name: f.name }, f.options.map((o) => h('option', { value: o }, o)));
    else control = h('input', { id, name: f.name, type: f.type, maxlength: f.max, min: f.type === 'number' ? 1 : false, max: f.type === 'number' ? 1000 : false, step: f.type === 'number' ? 1 : false });
    control.value = value;
    control.setAttribute('aria-describedby', `${id}-error`);

    grid.append(h('div', { class: `field${f.full ? ' full' : ''}`, 'data-field': f.name },
      h('label', { for: id }, f.label, f.type !== 'select' ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null),
      control,
      f.help ? h('span', { class: 'help' }, f.help) : null,
      h('span', { class: 'error', id: `${id}-error` })));
  }

  const submit = h('button', { type: 'submit', class: 'btn btn-primary' }, editing ? 'Save changes' : 'Post opportunity');
  form.append(
    h('h2', {}, editing ? 'Edit opportunity' : 'Post a research opportunity'),
    h('p', { class: 'hint' }, 'Fields marked * are required.'),
    summary, grid,
    h('div', { class: 'actions' }, submit,
      h('button', { type: 'button', class: 'btn', onclick: () => (editing ? showDetail(item.id) : showEmptyPanel()) }, 'Cancel')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = collect(form);
    const errors = validate(payload);
    showFieldErrors(form, summary, errors);
    if (Object.keys(errors).length) {
      form.querySelector('.has-error input, .has-error textarea, .has-error select')?.focus();
      return;
    }

    submit.disabled = true;
    const res = await api(editing ? `/${item.id}` : '', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    submit.disabled = false;

    if (!res.ok) {
      if (res.status === 404) { toast(errorMessage(res), 'error'); await loadList(); showEmptyPanel(); return; }
      summary.hidden = false;
      summary.replaceChildren(h('strong', {}, res.status === 400 ? 'The server rejected the form:' : 'Could not save:'),
        res.data && res.data.errors ? h('ul', {}, res.data.errors.map((m) => h('li', {}, m))) : h('p', {}, errorMessage(res)));
      toast(res.status === 400 ? 'Fix the highlighted problems and try again.' : errorMessage(res), 'error');
      return;
    }

    toast(editing ? 'Changes saved.' : 'Opportunity posted.');
    await loadList();
    await showDetail(res.data.id);
  });

  setPanel(form);
  form.querySelector('input, textarea')?.focus();
}

function collect(form) {
  const out = {};
  for (const f of FIELDS) {
    const raw = form.elements[f.name].value;
    out[f.name] = f.type === 'number' ? (raw.trim() === '' ? '' : Number(raw)) : raw.trim();
  }
  return out;
}

function validate(p) {
  const errors = {};
  for (const f of FIELDS) {
    const v = p[f.name];
    if (f.type === 'select') continue;
    if (v === '' || v === undefined) { errors[f.name] = `${f.label} is required.`; continue; }
    if (f.max && String(v).length > f.max) errors[f.name] = `${f.label} must be ${f.max} characters or fewer.`;
  }
  if (!errors.available_positions && (!Number.isInteger(p.available_positions) || p.available_positions < 1 || p.available_positions > 1000)) {
    errors.available_positions = 'Enter a whole number from 1 to 1000.';
  }
  if (!errors.application_deadline && Number.isNaN(Date.parse(p.application_deadline))) {
    errors.application_deadline = 'Enter a valid date.';
  }
  if (!['Open', 'Closed'].includes(p.status)) errors.status = 'Choose Open or Closed.';
  return errors;
}

function showFieldErrors(form, summary, errors) {
  form.querySelectorAll('.field').forEach((field) => {
    const msg = errors[field.dataset.field];
    field.classList.toggle('has-error', Boolean(msg));
    field.querySelector('.error').textContent = msg || '';
    field.querySelector('input, textarea, select').setAttribute('aria-invalid', msg ? 'true' : 'false');
  });
  const count = Object.keys(errors).length;
  summary.hidden = count === 0;
  summary.replaceChildren(...(count ? [h('strong', {}, `Please fix ${count} ${count === 1 ? 'field' : 'fields'} before saving.`)] : []));
}

/* ---------- Status change ---------- */
async function changeStatus(item, status, button) {
  button.disabled = true;
  const res = await api(`/${item.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  if (!res.ok) {
    toast(errorMessage(res), 'error');
    if (res.status === 404) { await loadList(); showEmptyPanel(); } else button.disabled = false;
    return;
  }
  toast(status === 'Closed' ? 'Opportunity closed.' : 'Opportunity reopened.');
  await loadList();
  await showDetail(item.id);
}

/* ---------- Delete ---------- */
function confirmDelete(item) {
  const dialog = $('#confirm-dialog');
  $('#confirm-text').textContent = `“${item.title}” will be permanently removed. This cannot be undone.`;
  dialog.returnValue = '';
  dialog.addEventListener('close', async function onClose() {
    dialog.removeEventListener('close', onClose);
    if (dialog.returnValue !== 'confirm') return;
    const res = await api(`/${item.id}`, { method: 'DELETE' });
    if (!res.ok) { toast(errorMessage(res), 'error'); if (res.status === 404) { await loadList(); showEmptyPanel(); } return; }
    toast('Opportunity deleted.');
    await loadList();
    showEmptyPanel();
  });
  dialog.showModal();
}

/* ---------- Start ---------- */
$('#btn-new').addEventListener('click', () => showForm());
document.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => {
  state.filter = chip.dataset.filter;
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
  renderList();
}));

showEmptyPanel();
loadList();

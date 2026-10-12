# Research Opportunity Portal

A web application where faculty members post, view, update, close and delete research opportunities in one place, so students no longer miss openings scattered across email, WhatsApp and noticeboards.

- **GitHub Repository:** https://github.com/YOUR-USERNAME/research-opportunity-portal  <!-- replace with your real link -->
- **Student:** NAME, P24-0000, CLASS  <!-- replace -->
- **Demo video:** add the link here if you do not include the video file in the ZIP

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js 18+ with Express |
| Database | MySQL 8 (MariaDB 10.5+ also works) via `mysql2` |
| Frontend | HTML, CSS and vanilla JavaScript (no build step) |
| API testing | Postman (collection exported in `postman/`) |

## Project structure

```
research-opportunity-portal/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app, static hosting, error handling
│   │   ├── db.js                  # MySQL connection pool (reads .env)
│   │   ├── validation.js          # Input validation rules
│   │   └── routes/opportunities.js# The 5 CRUD endpoints
│   ├── .env.example               # Template for your own credentials
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js                     # Talks to the REST API with fetch()
├── database/schema.sql            # Creates the database and table
├── postman/research-opportunity-portal.postman_collection.json
├── docs/DEMO_SCRIPT.md            # Shot-by-shot plan for the 1-minute video
└── README.md
```

## Setup and run

### 1. Prerequisites
- Node.js 18 or newer
- MySQL 8 running locally (or MariaDB)

### 2. Create the database
From the project root:

```bash
mysql -u <your_mysql_user> -p < database/schema.sql
```

This creates the `research_portal` database and the `opportunities` table. No data is pre-loaded; all records are created through the app or API.

### 3. Configure the backend
```bash
cd backend
cp .env.example .env        # on Windows: copy .env.example .env
```
Open `.env` and set `DB_USER` and `DB_PASSWORD` to your own MySQL credentials. The `.env` file is git-ignored and must never be committed.

### 4. Install and start
```bash
npm install
npm start
```
The server prints `Research Opportunity Portal running at http://localhost:3000`.

### 5. Open the app
Visit **http://localhost:3000**. The backend serves the frontend, so there is nothing else to start.

## Database schema

Table `opportunities`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT UNSIGNED, PK, auto-increment | Unique ID |
| `title` | VARCHAR(200) | Research title |
| `description` | TEXT | Research description |
| `research_area` | VARCHAR(100) | |
| `faculty_name` | VARCHAR(100) | Faculty member's name |
| `department` | VARCHAR(100) | |
| `required_skills` | VARCHAR(500) | Comma-separated text |
| `available_positions` | INT UNSIGNED | 1 to 1000 |
| `application_deadline` | DATE | `YYYY-MM-DD` |
| `status` | ENUM('Open','Closed') | Defaults to `Open` |
| `created_at`, `updated_at` | TIMESTAMP | Maintained by MySQL |

## REST API

Base URL: `http://localhost:3000`

| Operation | Method and path | Success | Errors |
|-----------|-----------------|---------|--------|
| Create | `POST /api/opportunities` | 201 + created record | 400 |
| Retrieve all | `GET /api/opportunities` | 200 + array | 500 |
| Retrieve one | `GET /api/opportunities/:id` | 200 + record | 400, 404 |
| Update | `PUT /api/opportunities/:id` | 200 + updated record | 400, 404 |
| Delete | `DELETE /api/opportunities/:id` | 200 + message | 400, 404 |

**Create body (all fields required except `status`, which defaults to `Open`):**
```json
{
  "title": "Machine Learning for Crop Disease Detection",
  "description": "Build image classifiers for wheat and maize diseases.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch, Image Processing",
  "available_positions": 3,
  "application_deadline": "2026-12-15",
  "status": "Open"
}
```

**Update:** `PUT` accepts any subset of the fields above, so closing an opportunity is simply `PUT /api/opportunities/:id` with `{ "status": "Closed" }`.

**Status codes used**

| Code | When |
|------|------|
| 200 OK | Successful read, update or delete |
| 201 Created | Opportunity created |
| 400 Bad Request | Missing or invalid fields, malformed JSON, or a non-numeric ID. The body lists every problem in an `errors` array |
| 404 Not Found | No opportunity with that ID (or unknown API route) |
| 500 Internal Server Error | Unexpected failure, such as the database being unreachable |

Error responses always look like `{ "message": "...", "errors": ["..."] }` (`errors` only for 400).

## Frontend features

1. Lists all opportunities from the API, with an Open/Closed filter
2. Shows the full details of a selected opportunity
3. Form to post a new opportunity
4. Edit option for an existing opportunity
5. "Close opportunity" button (and "Reopen")
6. Delete with a confirmation dialog
7. Success and error messages (toasts, inline field errors, and server-error summary)
8. Client-side validation of required fields, number range and dates (the server validates again)

No data is hard-coded: everything comes from the database through the API.

## Testing with Postman

1. Start the backend.
2. In Postman choose **Import** and select `postman/research-opportunity-portal.postman_collection.json`.
3. Open the collection and click **Run** (Collection Runner), or send the requests in order.

The collection covers, in order: create three opportunities, retrieve all, retrieve one, update, change status Open to Closed, delete, request the deleted record (404), and send invalid data (400). Each request has test scripts and IDs are stored automatically in collection variables. Running the collection against the local server passed all 18 assertions.

## Security notes

- Database credentials live only in `backend/.env`, which is listed in `.gitignore`.
- SQL uses parameterised queries; the frontend builds the page with `textContent`-based DOM calls, so stored text cannot inject HTML.

## Author

NAME, P24-0000, CLASS

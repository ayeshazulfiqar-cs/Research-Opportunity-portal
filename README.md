# Research Opportunity Portal

A simple web app where faculty members post, view, update, close and delete research opportunities in one place.

- **GitHub Repository:** https://github.com/ayeshazulfiqar-cs/Research-Opportunity-portal
- **Name:** AYESHA ZULFIQAR, Roll No: 24P-0663, Department: BS(CS)
- **Demo video:** https://drive.google.com/file/d/1Ly4_OPQVWhcKj8XARkkszrhXOgJ-bHle/view?usp=drive_link 

## Technologies

- Backend: Node.js with Express
- Database: MySQL (XAMPP's MariaDB also works)
- Frontend: HTML, CSS and JavaScript
- API testing: Postman

## Project structure

```
research-opportunity-portal/
├── backend/
│   ├── server.js          # the whole backend (5 API routes + validation)
│   ├── package.json
│   └── .env.example       # copy to .env and add your own MySQL login
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── database/schema.sql    # creates the database and table
├── postman/               # exported Postman collection
└── README.md
```

## How to run

You need **Node.js** (LTS) and **MySQL** (for example via XAMPP).

1. **Start MySQL** (in XAMPP, click Start next to MySQL).
2. **Create the database.** Either import `database/schema.sql` in phpMyAdmin (Import tab), or run in a terminal from the project folder:
   ```
   mysql -u root -p < database/schema.sql
   ```
3. **Add your database login.** In the `backend` folder, copy `.env.example` to a new file named `.env` and fill it in. For XAMPP:
   ```
   DB_USER=root
   DB_PASSWORD=
   ```
4. **Install and start the backend.** In a terminal:
   ```
   cd backend
   npm install
   npm start
   ```
   You should see `Server running at http://localhost:3000`.
5. **Open the app** in your browser: http://localhost:3000

The backend also serves the frontend, so there is nothing else to start.

## Database

One table, `opportunities`, with: `id`, `title`, `description`, `research_area`, `faculty_name`, `department`, `required_skills`, `available_positions`, `application_deadline`, `status` (Open or Closed), plus `created_at` and `updated_at`. The table is empty at the start; all data is added through the app.

## API

| Operation | Request | Success | Errors |
|-----------|---------|---------|--------|
| Create | `POST /api/opportunities` | 201 | 400 |
| Get all | `GET /api/opportunities` | 200 | 500 |
| Get one | `GET /api/opportunities/:id` | 200 | 400, 404 |
| Update | `PUT /api/opportunities/:id` | 200 | 400, 404 |
| Delete | `DELETE /api/opportunities/:id` | 200 | 400, 404 |

Example body for create:

```json
{
  "title": "Machine Learning for Crop Disease Detection",
  "description": "Build image classifiers for wheat and maize diseases.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch",
  "available_positions": 3,
  "application_deadline": "2026-12-15",
  "status": "Open"
}
```

- `status` is optional when creating and defaults to `Open`.
- `PUT` accepts any of the fields. To close an opportunity, send `{ "status": "Closed" }`.
- **400** means missing or invalid data (the response lists the problems), **404** means no opportunity with that ID, **500** means a server or database error.

## Frontend features

1. Lists all opportunities
2. Shows full details of a selected opportunity (View button)
3. Form to create a new opportunity
4. Edit option to update an opportunity
5. "Close opportunity" button (Open to Closed)
6. Delete button (asks for confirmation)
7. Success and error messages at the top of the page
8. Basic validation of required fields

## Testing with Postman

1. Start the backend.
2. In Postman, click Import and choose `postman/research-opportunity-portal.postman_collection.json`.
3. Open the collection and click Run. The requests run in this order: create 3 opportunities, get all, get one, update, close, delete, get the deleted one (404), send invalid data (400).

## Security

The database login is stored only in `backend/.env`, which is listed in `.gitignore` and is not uploaded to GitHub.

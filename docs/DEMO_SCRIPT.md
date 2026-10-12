# One-minute demo video: shot list

Keep it under 60 seconds. Use a screen recorder (OBS, Xbox Game Bar with Win+G, or QuickTime) with the terminal, browser and Postman/Bruno visible. Rehearse once and trim dead air. Have 1 or 2 opportunities already in the database so the list isn't empty, but create a fresh one live.

| Time | What to show | What to say (short) |
|------|--------------|---------------------|
| 0:00-0:07 | Terminal: `npm start` showing "running at http://localhost:3000". Browser opens the app. | "Backend is running, and here is the frontend." |
| 0:07-0:17 | Click **Post opportunity**. Click Save with the form empty to show red validation messages. Then fill it in and save. | "Validation blocks empty fields. Now I create an opportunity." |
| 0:17-0:24 | The list shows stored records; click one to show details. | "Records load from the database through the API." |
| 0:24-0:32 | **Edit**, change positions, **Save changes**. | "Updating an opportunity." |
| 0:32-0:38 | Click **Close opportunity**; badge turns Closed. | "Closing it." |
| 0:38-0:44 | Click **Delete**, confirm; success message appears. | "Deleting it." |
| 0:44-0:58 | Switch to Postman: run `GET /api/opportunities/{deleted id}` to show **404**, then the invalid POST to show **400** with the error list. | "The API returns 404 for the deleted record and 400 for invalid data." |

Tip: keep the Postman collection open with the deleted ID already filled in so you don't waste seconds.

# REST API

All write requests require `Content-Type: application/json`. Errors use `{ "message": "Readable explanation" }`. Authentication uses an HttpOnly cookie containing a signed JWT. Use your API client's cookie jar for subsequent requests. During development, use port 3000 directly or `/api` through Vite.

| Method | Endpoint                         | Permission     | Result                                      |
| ------ | -------------------------------- | -------------- | ------------------------------------------- |
| GET    | `/api/health`                    | Public         | Health response                             |
| POST   | `/api/auth/signup`               | Public         | 201, `{user}`; student role only            |
| POST   | `/api/auth/login`                | Public         | `{user}` and a fresh JWT cookie            |
| GET    | `/api/auth/me`                   | Signed in      | `{user}`                                    |
| POST   | `/api/auth/logout`               | Signed in      | Revokes token and clears cookie                            |
| PATCH  | `/api/profile`                   | Signed in      | Validated profile fields                    |
| GET    | `/api/drives`                    | Signed in      | `{drives}`; students cannot see drafts      |
| POST   | `/api/drives`                    | Officer        | 201, `{drive}`                              |
| PATCH  | `/api/drives/:id`                | Officer        | Updated drive; all editable fields required |
| POST   | `/api/drives/:id/apply`          | Student        | 201, `{application}`                        |
| GET    | `/api/applications`              | Signed in      | Own applications; officers see all          |
| PATCH  | `/api/applications/:id/status`   | Officer        | Stage + history note                        |
| POST   | `/api/applications/:id/withdraw` | Owning student | Withdraw non-terminal application           |
| GET    | `/api/applications/export`       | Officer        | CSV attachment                              |
| GET    | `/api/students`                  | Officer        | Student directory, no password hashes       |
| GET    | `/api/announcements`             | Signed in      | Latest 100 notices                          |
| POST   | `/api/announcements`             | Officer        | 201, `{announcement}`                       |

Signup body:

```json
{
  "name": "Student Name",
  "email": "student@college.edu",
  "password": "your-own-password"
}
```

Profile body:

```json
{
  "name": "Student Name",
  "branch": "Electronics & Computer Science",
  "graduationYear": 2026,
  "cgpa": 7.46,
  "backlogs": 0,
  "phone": "",
  "skills": ["React", "Node.js"],
  "resumeUrl": "https://example.com/my-resume.pdf",
  "githubUrl": "https://github.com/your-username"
}
```

Officer stage body:

```json
{ "status": "Interview", "note": "Prepare your project walkthrough." }
```

Use `{}` for apply, withdrawal and logout. Use ISO timestamps for drive dates. Drive request fields are defined in `server/middleware/validate.js` and the officer drive form. Common statuses: 400 invalid input/ineligible, 401 signed out, 403 insufficient role/origin, 404 missing record, 409 duplicate/conflict, 415 incorrect content type, 429 rate limit.

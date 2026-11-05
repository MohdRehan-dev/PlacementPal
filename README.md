# PlacementPal

A single-college placement management application built with **MongoDB, Express, React, and Node.js**. Students find eligible campus drives and track applications; placement officers manage drives, review applicants, publish notices, and export reports.

Designed as a portfolio project with understandable MVC-style backend code and a responsive React interface. Company names and opportunities in the seed and browser demo are fictional. This is not an official college portal.

## Start here (Windows / VS Code)

Install Node.js 22+ and MongoDB Community (or use MongoDB Atlas). Open the extracted `PlacementPal` folder in VS Code and its terminal.

```powershell
npm install
Copy-Item server/.env.example server/.env
```

Edit `server/.env`:

- Set `MONGODB_URI` to your local MongoDB URI or Atlas connection string for a **new placementpal database**.
- Generate a JWT signing secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste it into `JWT_SECRET`.
- Upgrading from session login? Rename `SESSION_SECRET` to `JWT_SECRET` in your local `server/.env`, generate a fresh value, and sign in again.
- Set `SEED_ADMIN_PASSWORD` and `SEED_STUDENT_PASSWORD` to your own passwords (8+ characters).
- Keep `APP_ORIGIN=http://localhost:5173` for local development.

Then run:

```powershell
npm run seed
npm run dev
```

Open **http://localhost:5173**. MongoDB must be running. Both the React development server and Express API start together. Vite proxies `/api` to Express on port 3000.

Seeded sign-ins:

| Account           | Email                                                  | Password                     |
| ----------------- | ------------------------------------------------------ | ---------------------------- |
| Placement officer | `admin@placementpal.demo` (or your `SEED_ADMIN_EMAIL`) | Your `SEED_ADMIN_PASSWORD`   |
| Student           | `student@placementpal.demo`                            | Your `SEED_STUDENT_PASSWORD` |

Registration always creates a **student**. The seed script is the bootstrap path for the first placement officer. It adds demonstration records without deleting existing data, changing passwords, or upgrading an existing student to admin. Rerunning it does not refresh existing drive dates; update old deadlines through Manage drives.

On macOS/Linux, use `cp server/.env.example server/.env` instead of `Copy-Item`.

### Explore without a database

```powershell
npm install
npm run dev -w client
```

Open the Vite URL and click **Explore student demo** or **Explore placement officer demo**. The visible demo banner includes a role switch. Browser demo data lives in localStorage; the chosen demo role lives in sessionStorage. Sign out to return to real API login. Clear site data to reset the demo. Demo resume links are placeholders.

**Browser demo is not MongoDB-backed authentication.** Role switching exists only in the browser demo. Real permissions are checked by Express using the signed JWT and current database user role.

## Features

| Students                                                       | Placement officers                                 |
| -------------------------------------------------------------- | -------------------------------------------------- |
| Register, sign in, sign out                                    | Seed-provisioned officer sign-in                   |
| Maintain academics, skills, resume and portfolio links         | Create and edit placement drives                   |
| Search by company, role, location and skill                    | Draft, publish and close drives                    |
| Filter by eligibility, applied drives, deadlines and work mode | Define CGPA, branch, batch and backlog eligibility |
| Sort by deadline or highest CTC                                | View student directory and submitted profiles      |
| Apply once to eligible, open drives                            | Review applications and change stages with notes   |
| Track status history and withdraw pending applications         | Export application records to CSV                  |
| View placement notices and upcoming drives                     | Publish campus announcements                       |

The overview computes counts from actual returned records. No invented placement rates or application numbers are shown. CTC is an annual amount in LPA, including annualized sample internship compensation.

## Code map

```text
client/src/
  components/      Shared cards, dialogs, fields and navigation
  pages/           Overview, drives, applications, profile, students, notices
  context.jsx      Authentication state, API requests, notifications
  hooks.js         Fetch/refresh state for API resources
  constants.js     Labels, formatting and demo eligibility display
  demo.js          Explicit browser-only demonstration adapter
server/
  controllers/     Request handling and business operations
  models/          Mongoose schemas and indexes
  routes/          REST endpoints and permission requirements
  middleware/      Authentication, authorization and Zod validation
  utils/           Eligibility policy, errors and async wrapper
  tests/           Policy/validation tests and MongoDB integration tests
  app.js           Express factory, JWT cookies, protections and error handling
  index.js         Connect to MongoDB, then listen
  seed.js          Non-destructive demonstration setup
```

Backend uses familiar CommonJS (`require` / `module.exports`), like Wanderlust. React uses ES modules and small page/component modules. See [Architecture](docs/ARCHITECTURE.md), [API](docs/API.md), [Deployment](docs/DEPLOYMENT.md), and [Interview guide](docs/INTERVIEW_GUIDE.md).

## Validation

```powershell
npm run build
npm run test:unit
npm run test:integration
npm test
```

`npm test` runs all server tests. Integration tests use `mongodb-memory-server`, which starts an isolated temporary real MongoDB and downloads its binary on first use. It does not connect to your application database. A compatible OS and permission to start MongoDB are required. The full integration suite tests auth, ownership, roles, deadlines, duplicate prevention, status history, CSV, notices, and logout.

See [Verification](docs/VERIFICATION.md) for what was actually executed in the creation environment and its limitations. Do not treat included tests as proof they passed.

The frontend uses Axios for API calls and Tailwind utilities for the app shell and accessible labels. Component styling lives in CSS.

## Security and data design

- Bcrypt password hashing; password hashes omitted from serialized users.
- Eight-hour JWTs in HttpOnly cookies, with MongoDB-backed logout revocation and secure cookies in HTTPS production.
- Role checks on every officer-only endpoint; registration and profile fields cannot set permissions.
- Explicit validation of request payloads, HTTPS profile links, numeric bounds, and drive date/CTC consistency.
- Server-side eligibility checks on submission; database compound unique index prevents duplicate applications, including concurrent requests.
- Submitted profile snapshots; append-only status entries through the API; optimistic concurrency checks for status changes.
- Same-origin API deployment, write-origin checks, JSON-only writes, SameSite cookies, Helmet headers and rate limiting.
- CSV escaping and formula-injection mitigation.
- No environment files or credentials included in the project archive.

## Deliberate scope and next improvements

This version onboards Rizvi. The API scopes drives, applications, notices and the directory by college ID. Legacy records stay in the Rizvi workspace. Academics are student-reported; official academic verification, invite-only enrollment, multi-college onboarding, email verification/password reset, email reminders, resume file uploads, pagination for large datasets, and a formal audit trail are future work. Resume links can be edited or revoked externally after submission, so the stored snapshot preserves the URL, not the PDF bytes. Officers can correct application stages freely (except withdrawn applications), and there is no rigid company-specific state machine. Closing a drive preserves applications.

Before using real student data, add institutional onboarding and verification, access/retention policies, and backup/restore procedures. Use fictional data for the portfolio demo.

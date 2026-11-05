# Verification record

## Release checks

- 32 backend tests passed with isolated MongoDB 7.0, including JWT revocation, role enforcement, college scoping, legacy data, application snapshots, duplicate protection and CSV authorization.
- Six drive-filter tests and the production Vite build passed.
- The production dependency audit reported zero known vulnerabilities at the time of the check.
- Headless Chromium against the production build and a temporary MongoDB verified mobile signup, session persistence, profile save and reload, student application submission, TPO stage update, CSV export, the student timeline, and logout. The test provisioned the officer and created the published drive through the API.
- GitHub publication and live Vercel, Render and Atlas verification remain pending.

## Local acceptance checklist

- Register a fresh student, reload, sign out, and sign in again.
- Verify anonymous and student accounts cannot call officer endpoints.
- Complete the student's academics and use a real, viewable resume URL.
- Apply to a matching drive; confirm the record exists in Compass.
- Try a duplicate request and an ineligible/expired drive; verify rejection.
- Create/edit/publish/close a drive as an officer.
- Update an application with a note; confirm the student sees its timeline.
- Attempt to access another student's application; verify denial.
- Export a CSV and inspect the rows.
- Post a notice and confirm it appears for students.
- Run all tests and inspect the layout at desktop and mobile widths.

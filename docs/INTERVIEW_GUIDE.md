# PlacementPal interview walkthrough

## Explain it in 60 seconds

“PlacementPal is a MERN placement management app for a college. Students maintain their academic profile, explore eligible company drives, apply, and follow application updates. Placement officers publish drives, define eligibility, review applicants, update stages, and export application data. I used React for the interface, Express controllers and middleware for the API, and MongoDB with Mongoose for persistence. The backend checks roles and eligibility rather than trusting the UI. A unique compound index prevents duplicate applications, and submitted profile snapshots preserve what a student applied with.”

Practice this in your own words. Be candid about AI assistance: describe what you understand, tested, changed, and can maintain. Do not claim independent authorship or real college adoption unless true.

## Five-minute recruiter demo

1. Open the student overview and point to counts computed from records.
2. Open My profile and explain how academics control eligibility.
3. Search a drive, inspect criteria, and submit an eligible application.
4. Open My applications and show the submission timeline.
5. Switch to the officer demo; in the real API this requires a separate officer login.
6. Create a draft drive, then publish it. Explain why students cannot see drafts.
7. Update an application's stage with a note; export the CSV.
8. Return to the student view and show the updated timeline.
9. Show a relevant controller, middleware, model index, and test.

Use fictional data. Browser demo switches views for convenience; demonstrate actual authentication against the Express API once configured.

## Questions to prepare

| Question                               | What to understand in the code                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| How does JWT logout work?          | Logout deletes the active token ID from MongoDB and clears the HttpOnly cookie.                 |
| How do permissions work?               | `requireAuth`, current database user role, `requireAdmin`, owning-student filters                            |
| What if someone applies twice?         | Compound unique index and duplicate-key 409 response                                                         |
| What if someone bypasses the UI?       | Zod allowlists, role checks, eligibility recomputation in `drives.apply`                                     |
| Why store application snapshots?       | Preserve submitted academic values and resume URL when profile changes                                       |
| Why embed history but reference users? | History belongs to and is read with an application; users are shared records                                 |
| How are async errors handled?          | `wrapAsync`, `ApiError`, centralized JSON error middleware                                                   |
| How do edits appear on screen?         | Request, mutation success, resource refresh, loading/error/notification states                               |
| What would you improve at scale?       | Server pagination, indexed filtering, reporting aggregates, verified enrollment                              |
| What races remain?                     | Drive eligibility checks and insertion are separate; transactions are a future improvement                   |
| What is not implemented?               | Password recovery, email verification/reminders, official academic verification, file uploads, multi-tenancy |

## Learning path

1. Start at `server/models/Application.js`: explain each reference and the unique index.
2. Follow one apply request: UI button → shared request helper → route → auth → controller → eligibility → MongoDB.
3. Rebuild the eligibility function yourself and add a failing-condition test.
4. Explain a controlled input, a React state update, and the `useResource` effect dependencies.
5. Change one feature yourself, such as an employment-type filter, then test it.

## Resume wording after local verification and deployment

**PlacementPal — College Placement Management App**
React, Node.js, Express, MongoDB, Mongoose

- Built a MERN placement portal with student/officer access, placement-drive management, and application tracking.
- Implemented server-side academic eligibility checks, duplicate-application prevention, and application status histories.
- Developed responsive dashboards, searchable drive listings, profile management, campus notices, and CSV reporting.

Add verified GitHub and live links before putting this project on your resume. Do not invent users, placement percentages, performance improvements or test results. Read and explain every claim you include.

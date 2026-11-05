# Architecture and decisions

## Request flow

A React event calls the shared Axios `request()` helper. Vite proxies `/api` to Express in development. In production, Vercel can proxy the API to Render under the frontend origin. Express can also serve the built React files directly. The server verifies the JWT and checks its active token ID in MongoDB, fetches the current User, validates permissions and input, invokes a controller, and serializes a JSON response.

Backend responsibilities stay separate: routes describe permissions and URLs; controllers orchestrate operations; models persist records; middleware performs shared checks; the eligibility utility holds the application rules. The client uses React context for session/toast/API access and a small resource hook for loading, error, and refresh states. Redux is unnecessary for the current state size.

## Relationships

| Model                | Relationships                                         | Reason                                                       |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| User                 | One student can have many applications                | Store identity/academics once                                |
| Drive                | References the creating officer                       | Track who created an opportunity                             |
| Application          | References one student and one drive                  | Query either side; compound unique index prevents duplicates |
| Application.snapshot | Embedded submitted name, email, academics, resume URL | Profile edits must not rewrite the submitted application     |
| Application.history  | Embedded status, note and date entries                | Timeline is small and read with its application              |
| Announcement         | References the creating officer                       | Campus updates                                               |
| Auth token | Active token ID and expiry in MongoDB | Logout revokes the token and expired records are cleaned up |

The database unique index is the final duplicate guard. A client-side “Applied” badge alone is insufficient because requests can be concurrent or sent outside the interface.

## Eligibility

The server rejects applications to drafts, closed or expired drives. It verifies CGPA, branch, graduation year, active backlogs, and presence of a resume link. Missing profile fields fail eligibility. An authenticated student can apply only as themselves; request bodies cannot choose another student or a forged application stage.

Client-side eligibility is informative. The API always recomputes it at submit time. Editing a drive after applications exist changes future eligibility without invalidating past applications. Application stages can be corrected by officers, while withdrawals remain terminal in this version.

## Authentication choice

Login issues a signed JWT in an HttpOnly cookie. MongoDB stores the active token ID until logout or expiration. The production cookie is secure and httpOnly with SameSite=Lax. The API uses the current database role, not a role sent by the client. A profile update uses a field allowlist via Zod.

The browser demonstration is a separate adapter, not an authentication system. Its role switch never grants server permissions.

## Concurrency and tradeoffs

Status/withdrawal operations read an application version and update only if its `__v` still matches, incrementing the version with the appended history entry. Conflicts return 409 rather than losing another update. Drive closure and application creation are not transactional; a drive changing between eligibility check and insert is a remaining race to address with a transaction or stronger locking for institutional use.

Filtering and dashboard aggregation currently happen over bounded portfolio-scale data in React. Larger college datasets need server pagination, indexed filtering, and aggregate reporting endpoints. Drive application counts are queried with a MongoDB aggregation; student responses contain only each student's own applications.

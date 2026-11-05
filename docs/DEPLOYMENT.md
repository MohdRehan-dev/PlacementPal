# Deployment with Render, Vercel and MongoDB Atlas

The single-service setup serves the built React app from Express on the same origin. This avoids cross-origin cookie configuration. The private hosted browser preview is a separate static demonstration.

## Prepare source

1. Put this extracted project in a new GitHub repository. Keep `node_modules`, `.env`, and `client/dist` out of Git; `.gitignore` is supplied.
2. Create a separate MongoDB Atlas database/user for this project. Keep the URI private. Configure Atlas network access for your hosting service using its supported network options.
3. Create a Node web service on your chosen host and connect the repository.

Typical Node service settings:

| Setting        | Value                           |
| -------------- | ------------------------------- |
| Root directory | Repository root                 |
| Build command  | `npm ci && npm run build`       |
| Start command  | `npm start`                     |
| Health path    | `/api/health`                   |
| Node version   | A supported Node.js 22+ release |

Configure runtime environment variables in the host, not Git:

| Variable         | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| `NODE_ENV`       | `production`                                            |
| `MONGODB_URI`    | Your Atlas URI                                          |
| `JWT_SECRET` | Unique random 32+ character secret                      |
| `APP_ORIGIN`     | Exact production HTTPS origin, without a trailing slash |
| `PORT`           | Use the host-provided value                             |

On a trusted local machine, point `server/.env` to the intended new Atlas database, configure your own seed passwords, and run `npm run seed` once to bootstrap the officer and fictional demo data. Remove seed passwords from the local file afterward if no longer needed. The seed script is not run automatically on server boot.

Use HTTPS. Express trusts one reverse proxy in production; adjust that only if your hosting network requires a different topology. Secure auth cookies require the proxy to report HTTPS correctly. The hosting environment must retain runtime dependencies needed by Express.

## Verify after deployment

Load the root and a direct `/drives` URL. Sign in, reload, and confirm login persistence. Apply to a drive and inspect MongoDB. Check that a student cannot access officer endpoints. Check `/api/health` and server logs. Never log JWT signing secrets or MongoDB URIs.

The dependency lockfile is included. Provider UI labels, plan prices and supported runtime settings can change; check the provider's documentation when deploying. This file describes the app's expected commands and environment rather than a verified deployment on your account.

## Vercel frontend with Render API

1. Import the repository into Render using `render.yaml`. Set `MONGODB_URI` to the Atlas connection string and `APP_ORIGIN` to the final Vercel HTTPS origin.
2. Replace the placeholder Render host in `vercel.json`, preserving `/api/:path*`. Import the repository root in Vercel. Requests use the frontend origin through a rewrite, so credentialed CORS is unnecessary.
3. Seed a dedicated demo database. Verify cookies, role permissions, the student-to-officer flow, CSV export, logout, and direct route reloads through the Vercel URL.
4. Add verified links and screenshots to the README.

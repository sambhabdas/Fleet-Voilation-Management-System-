# Deployment Guide: Fleet Violation Monitoring System

## Vercel/Static Hosting Note

Vercel and similar static hosts do not support persistent local storage. For demo or cloud deployments, the backend now supports a configurable uploads directory via the `UPLOADS_DIR` environment variable (default: `/tmp/uploads`).

- On Vercel, uploads will be stored in `/tmp/uploads` (ephemeral, resets on redeploy).
- For production, use a persistent storage solution (e.g., AWS S3, Azure Blob Storage) and update the upload logic accordingly.

## How to Set

- In your backend `.env` file, add:
  ```
  UPLOADS_DIR=/tmp/uploads
  ```
- This is now the default if unset.

## Local Development
- By default, uploads are stored in `backend/uploads/`.
- For cloud/static hosting, `/tmp/uploads` is used.

## More
See the main `README.md` for full deployment and environment setup instructions.

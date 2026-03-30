# SportSync

Web-based athlete dating app (CS4116 Software Development Project).

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env` and update with your database credentials.

4. Set up the database:
   - Use the schema in `backend/db_design/db_schema.sql` to create the MySQL database.
   - For connection details, see `backend/db_connection_instructions.md`.

5. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3000`.

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Open in browser: http://localhost:5173

## Scripts

- `npm run dev` — start development server (Vite)
- `npm run build` — production build

## Project structure

- `backend/` — Express.js API server
- `frontend/src/app/` — React app (pages, components, routes)
- `design_process/` — website pages, ER diagram, proposed DB schema
- `public/` — static assets (e.g. images)

# SportSync Backend

Express.js API server for the SportSync dating app.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   - Update `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` with your MySQL credentials.
   - Set `JWT_SECRET` to a secure random string.

3. Ensure the database is set up using the schema in `db_design/db_schema.sql`.

4. Start the server:
   ```bash
   npm run dev  # For development with nodemon
   # or
   npm start    # For production
   ```

The server will run on `http://localhost:3000`.

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/profiles` - Get user profiles (TODO: implement)

## Database Connection

The backend connects to MySQL using the credentials in `.env`. For production, use SSH tunneling as described in `db_connection_instructions.md`.
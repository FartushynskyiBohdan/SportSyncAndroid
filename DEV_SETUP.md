# SportSync — Local Dev Setup

This guide walks you through everything needed to run the full stack locally. The database lives on an Oracle Cloud VM; you access it through an SSH tunnel that you keep running while developing.

---

## Prerequisites

- **Node.js** v18+ (use [nvm](https://github.com/nvm-sh/nvm) if you don't have it)
- **Git**
- The **SSH private key** file — ask the project lead. Save it somewhere safe, e.g. `~/.ssh/sportsync/ssh-key-2026-03-10.key`
- The **`.env` file** for the backend — ask the project lead (contains DB credentials and JWT secret)

---

## 1. SSH Key Permissions

On macOS / Linux, the key file must be readable only by you or SSH will refuse to use it:

```bash
chmod 600 ~/.ssh/sportsync/ssh-key-2026-03-10.key
```

---

## 2. Add the SSH Host Alias

Add the following block to your `~/.ssh/config` file (create the file if it doesn't exist):

```
Host oracle-vm
    HostName 130.162.191.244
    User ubuntu
    IdentityFile ~/.ssh/sportsync/ssh-key-2026-03-10.key
    IdentitiesOnly yes
```

You can verify it works with a plain connection test:

```bash
ssh oracle-vm
```

Type `exit` once you're in. If it connects, you're set.

---

## 3. Open the Database Tunnel

The backend connects to MySQL on `127.0.0.1:3306`. The tunnel forwards that local port to the VM, where MySQL is actually running.

Run this command in its own terminal tab and **leave it open** for the whole dev session:

```bash
ssh -L 3306:127.0.0.1:3306 oracle-vm -N
```

- `-L 3306:127.0.0.1:3306` — forward local port 3306 to port 3306 on the VM
- `-N` — don't execute a remote command, just hold the tunnel open

The command produces no output when it's working. If it exits immediately, check that your key path and permissions are correct (step 1–2).

> **Keep this running whenever you use the backend.** If the backend throws database connection errors, this tunnel being closed is almost always why.

---

## 4. Backend

In a new terminal tab:

```bash
cd backend
npm install          # first time only
```

Drop the `.env` file you received from the project lead into the `backend/` directory. It should look like:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=cs4116_db
JWT_SECRET=...
```

Then start the dev server:

```bash
npm run dev
```

The backend runs on **http://localhost:3000** and hot-reloads on file changes (nodemon).

---

## 5. Frontend

In another terminal tab:

```bash
cd frontend
npm install          # first time only
npm run dev
```

The frontend runs on **http://localhost:5173**. All `/api/...` requests are proxied to `localhost:3000` automatically — no CORS setup needed.

---

## 6. Typical Session Checklist

1. **Terminal 1:** `ssh -L 3306:127.0.0.1:3306 oracle-vm -N` → leave open
2. **Terminal 2:** `cd backend && npm run dev`
3. **Terminal 3:** `cd frontend && npm run dev`
4. Open http://localhost:5173

---

## 7. GUI Database Access (DBeaver / Beekeeper Studio)

See [`backend/db_connection_instructions.md`](backend/db_connection_instructions.md) for a step-by-step guide to connecting DBeaver to the database via SSH tunnel.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend: `ECONNREFUSED 127.0.0.1:3306` | Tunnel not running — re-run step 3 |
| Backend: `Access denied for user` | Wrong credentials in `.env`, or `.env` missing |
| SSH: `Permission denied (publickey)` | Key file permissions wrong — re-run step 1 |
| SSH: `Connection refused` | VM may be down; contact project lead |
| Frontend shows blank / 401 errors | Backend not running, or JWT_SECRET mismatch |

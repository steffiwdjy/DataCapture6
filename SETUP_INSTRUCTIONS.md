# Setup Instructions for Data Capture-3

## Requirements
1. **MySQL Server** must be running on localhost:3306
2. **Node.js** (already installed)

## Step 1: Set up MySQL Database

### Option A: Using MySQL Command Line
1. Open MySQL command line or MySQL Workbench
2. Run this command:
```sql
CREATE DATABASE IF NOT EXISTS `new_official_thejarrdin_cihampelas` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Option B: Check if MySQL is running
- On Windows, MySQL service should be running
- Check Windows Services (services.msc) for "MySQL80" or similar
- If not running, start it

## Step 2: Verify Configuration

The server is configured with:
- **Database**: new_official_thejarrdin_cihampelas
- **Username**: root
- **Password**: (empty)
- **Host**: localhost
- **Port**: 3306

If your MySQL setup is different (different password, username, etc.), update:
`server/config/.env`

## Step 3: Run the Application

From the root directory (`E:\Kuliah\TA\TA1-v2\Data Capture-3`):

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173 (React + Vite)
- **Backend**: http://localhost:3000 (Node.js + Express)

## What Happens when you run `npm run dev`:

1. **Server starts** on port 3000 with routes:
   - `/api/data/:FiturID/:Tipe/:StartDate/:EndDate` - Get data
   - `/api/aspirasi/:Tipe/:StartDate/:EndDate` - Get aspirations
   - `/api/user` - Get users
   - And many more...

2. **Client starts** on port 5173 and proxies `/api` requests to http://localhost:3000

3. Vite's proxy (in `client/vite.config.js`) routes all `/api/*` calls to the backend

## Troubleshooting

### Error: "listen EADDRINUSE: address already in use :::3000"
- Port 3000 is already in use
- Kill the process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force`
- Or use a different port by updating `server/index.js` (line 48)

### Error: "ConnectionRefusedError"
- MySQL is not running
- Start MySQL service on Windows (Services > MySQL > Start)
- Or ensure the database name and credentials in `server/config/.env` are correct

### Client shows 500 errors
- **Make sure the backend is running** before accessing the client
- Check backend logs for detailed errors
- Verify database is properly connected

## Port Reference
- **Frontend**: 5173 (development Vite server)
- **Backend**: 3000 (Node.js Express server)
- **MySQL**: 3306 (database)

## Next Steps
1. Ensure MySQL is running
2. Create the database (see Option A above)
3. Run `npm run dev` from the root directory
4. Open http://localhost:5173 in your browser

Both servers will run concurrently and are ready to go!

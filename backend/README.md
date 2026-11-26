# Waste2Wallet backend

## Local setup

Create `backend/.env` with the existing connection settings:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/waste2wallet
JWT_SECRET=replace-with-a-long-random-secret
```

Start MongoDB before starting the API. The server waits for MongoDB to connect before it listens on port 3000.

```bash
npm install
npm run dev
```

## Initial accounts

The bootstrap script is non-destructive and idempotent. It creates an account only when the corresponding environment variables are supplied and the email does not already exist. Existing users are never promoted, overwritten, or given a new password.

Temporarily add the following variables to `backend/.env`:

```env
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=use-a-unique-password-at-least-8-characters
BOOTSTRAP_ADMIN_NAME=Waste2Wallet Administrator

BOOTSTRAP_COLLECTOR_EMAIL=collector@example.com
BOOTSTRAP_COLLECTOR_PASSWORD=use-a-different-unique-password
BOOTSTRAP_COLLECTOR_NAME=Waste Collector
```

Run the bootstrap from `backend/`, then remove the bootstrap variables from `.env`:

```bash
npm run bootstrap
```

The script never drops collections or seeds demo users and transactions. Additional collectors can be created by an authenticated Admin through `POST /api/admin/collectors` with `name`, `email`, and a unique password.

## Location tracking

An authenticated Collector dashboard requests browser geolocation permission and sends meaningful coordinate changes (including accuracy and the browser GPS timestamp when available) to `PUT /api/collectors/location`. The API validates latitude and longitude, uses the JWT identity, and stores the latest coordinates, GPS metadata, and server `updatedAt` timestamp in the Collector's `User.location` field. Admins can view valid reported positions through `GET /api/collectors/locations`; an empty response means no Collector has shared a location yet. The Admin map polls this endpoint every four seconds and marks positions older than 60 seconds as stale.

For testing from a phone, set the frontend's `VITE_API_BASE_URL` to the backend computer's LAN address, for example `http://192.168.1.20:3000/api`, and run Vite with a host accessible on the LAN (`npm run dev -- --host 0.0.0.0`). Do not use `localhost` in the phone's browser.

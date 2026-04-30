# RideShare — Carpooling & Ride Sharing Platform

A full-stack, AWS-powered carpooling platform where users can offer or find carpool rides between cities, with real-time seat booking, instant SNS notifications, Redis-cached search, and a role-based admin dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Prerequisites](#prerequisites)
- [AWS Services & Resources](#aws-services--resources)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Reference](#api-reference)
- [Notifications Flow](#notifications-flow)
- [Caching Strategy](#caching-strategy)
- [Monitoring & Logging](#monitoring--logging)
- [Phase Implementation](#phase-implementation)

---

## Overview

RideShare lets drivers post available seats on their daily routes and riders book those seats in real time. Built on AWS cloud services for scalability, security, and observability.

**Core capabilities:**
- User registration and login via AWS Cognito with email verification
- Drivers post rides with source, destination, date, time, seats, and price
- Riders search and filter rides, book seats, and cancel bookings
- Atomic seat-count updates using PostgreSQL transactions to prevent double-booking
- SNS email/SMS notifications on every booking and cancellation — for both driver and rider
- ElastiCache Redis Serverless caches ride search results for fast response times
- Admin dashboard with platform-wide stats, user management, and ride oversight
- CloudWatch alarms and Winston structured application logging

---

## Architecture

```
Browser (React + Vite)
    │
    │  HTTP (Vite dev proxy → localhost:3000)
    ▼
Node.js / Express API (localhost:3000)
    ├── AWS Cognito (us-east-2)      → JWT auth (RS256), email verification, custom:role attribute
    ├── Aurora PostgreSQL 17.7       → Users, rides, bookings (IAM auth via Internet Access Gateway)
    ├── ElastiCache Redis Serverless → Ride search cache (TTL: 5 min), VPC-only in production
    ├── S3                           → User profile photo storage (public-read + CORS)
    ├── SNS                          → Booking & cancellation notifications
    └── CloudWatch                   → Metric alarms + Winston log shipping
```

---

## Tech Stack

| Layer         | Technology                                                          |
|---------------|---------------------------------------------------------------------|
| Frontend      | React 18, Vite, Tailwind CSS, Axios, Lucide, react-hot-toast       |
| Backend       | Node.js, Express 4, Joi validation, Morgan, Helmet                 |
| Database      | Aurora PostgreSQL 17.7 (Serverless v2), `pg` driver                |
| DB Auth       | IAM Database Authentication via `@aws-sdk/rds-signer`             |
| Cache         | ElastiCache Redis Serverless 7.1, ioredis (TLS enabled)            |
| Auth          | AWS Cognito (User Pool), JWT (RS256), jwks-rsa                     |
| Storage       | AWS S3, `@aws-sdk/client-s3`, presigned URLs                       |
| Notifications | AWS SNS (Standard topics), `@aws-sdk/client-sns`                   |
| Monitoring    | AWS CloudWatch alarms, Winston structured JSON logging             |
| File uploads  | Multer (memory storage, 5 MB limit)                                |
| Region        | `us-east-2` (all AWS services)                                     |

---

## User Roles

| Role   | Capabilities                                                         |
|--------|----------------------------------------------------------------------|
| Rider  | Search rides, book seats, cancel bookings, manage profile            |
| Driver | Post rides, view bookings per ride, cancel rides, manage profile     |
| Admin  | View platform stats, activate/deactivate users, delete rides         |

---

## Features

### Phase 1 — Basic Setup
- User registration with AWS Cognito (email + password, `custom:role` attribute)
- Email verification via Cognito 6-digit confirmation code
- JWT login returning `idToken`, `accessToken`, `refreshToken`
- Forgot password / reset password flow
- Drivers post rides: source, destination, date, time, seats, price, optional notes
- Riders browse all active available rides

### Phase 2 — Booking & Notifications
- **Atomic seat booking** using `SELECT ... FOR UPDATE` PostgreSQL transactions — prevents double-booking under concurrent load
- Duplicate booking detection (unique constraint on `ride_id + user_id`)
- Driver receives SNS notification when a rider books their ride
- Rider receives SNS confirmation on successful booking
- Rider can cancel a booking — driver is notified via SNS, seat count is restored
- Driver can cancel a ride — **all booked riders** are individually notified via SNS

### Phase 3 — Search, Cache & Dashboard
- Ride search with filters: source, destination, date, min price, max price
- Results cached in Redis (5-minute TTL); cache auto-invalidated on ride/booking changes
- Cache failures are silently swallowed — app falls back to DB transparently
- Admin dashboard: total users, rides, active rides, bookings, role breakdown
- Admin can activate/deactivate users, delete rides
- CloudWatch alarms for CPU, DB connections, Redis evictions, 5xx error rate
- Winston structured JSON logging to file + console

---

## Project Structure

```
carpooling/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── aws.js          # Cognito, S3, SNS, CloudWatch SDK clients
│   │   │   ├── db.js           # pg Pool + RDS IAM Signer (auto-refreshes token)
│   │   │   ├── redis.js        # ioredis singleton with TLS (ElastiCache Serverless)
│   │   │   └── logger.js       # Winston structured logger
│   │   ├── middleware/
│   │   │   └── auth.js         # Cognito JWT verification (RS256 + JWKS) + role guard
│   │   ├── routes/
│   │   │   ├── auth.js         # Register, confirm, login, forgot/reset password
│   │   │   ├── rides.js        # Search (cached), post, get, driver rides, cancel
│   │   │   ├── bookings.js     # Book (transaction), cancel, rider bookings, driver bookings
│   │   │   ├── users.js        # Profile get/update, S3 photo upload, presigned URL
│   │   │   └── admin.js        # Stats (cached), user management, ride management
│   │   ├── services/
│   │   │   ├── cache.js        # Redis get/set/invalidate for rides + stats
│   │   │   ├── s3.js           # Upload/delete profile photos, presigned PUT URLs
│   │   │   └── sns.js          # notifyRideBooked, notifyRideCancelled, notifyRidePosted
│   │   ├── app.js              # Express setup: helmet, CORS, rate limiter, routes
│   │   └── server.js           # Startup: DB connect → Redis connect → listen
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx         # Marketing home page
│   │   │   ├── Login.jsx           # Email/password login, role-based redirect
│   │   │   ├── Register.jsx        # 3-step wizard: info → role → email verify
│   │   │   ├── SearchRides.jsx     # Ride search + booking modal with seat stepper
│   │   │   ├── DriverDashboard.jsx # Post rides, view bookings, cancel rides
│   │   │   ├── RiderDashboard.jsx  # View and cancel own bookings
│   │   │   ├── AdminDashboard.jsx  # Platform stats and user/ride management
│   │   │   └── Profile.jsx         # Edit profile, S3 photo upload
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Sticky nav, role-based links, mobile menu
│   │   │   └── RideCard.jsx        # Ride card with seat progress bar, Book Now
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Auth state, login/logout, localStorage tokens
│   │   └── services/
│   │       └── api.js              # Axios instance with Bearer token interceptor
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── database/
│   └── schema.sql              # Aurora PostgreSQL schema (ENUMs, triggers, indexes, seed)
│
└── infrastructure/
    ├── sns-setup.js            # Create SNS topics, set display names
    ├── s3-setup.js             # Create S3 bucket, unblock public access, set CORS
    └── cloudwatch-setup.js     # Create 4 CloudWatch metric alarms
```

---

## Database Schema

> **Engine:** Aurora PostgreSQL 17.7 Serverless v2  
> **Auth:** IAM Database Authentication (Internet Access Gateway)  
> **Schema run via:** AWS CloudShell using `aws rds generate-db-auth-token`

### users
| Column            | Type                               | Notes                          |
|-------------------|------------------------------------|--------------------------------|
| user_id           | VARCHAR(36) PK                     | UUID                           |
| name              | VARCHAR(255) NOT NULL              |                                |
| email             | VARCHAR(255) UNIQUE NOT NULL       |                                |
| role              | ENUM(driver, rider, admin)         | PostgreSQL TYPE, default rider |
| cognito_sub       | VARCHAR(255) UNIQUE                | Cognito UserSub                |
| phone             | VARCHAR(20)                        | Optional                       |
| profile_photo_url | VARCHAR(500)                       | S3 public URL                  |
| is_active         | BOOLEAN                            | Default: true                  |
| created_at        | TIMESTAMP                          | Default: now()                 |
| updated_at        | TIMESTAMP                          | Auto-updated via trigger       |

### rides
| Column          | Type                                      | Notes                    |
|-----------------|-------------------------------------------|--------------------------|
| ride_id         | VARCHAR(36) PK                            | UUID                     |
| driver_id       | VARCHAR(36) FK → users ON DELETE CASCADE  |                          |
| source          | VARCHAR(255) NOT NULL                     |                          |
| destination     | VARCHAR(255) NOT NULL                     |                          |
| date            | DATE NOT NULL                             |                          |
| time            | TIME NOT NULL                             |                          |
| seats_available | INT CHECK >= 0                            | Decremented on booking   |
| seats_total     | INT CHECK > 0                             | Original seat count      |
| price           | DECIMAL(10,2) CHECK >= 0                  | Per seat                 |
| notes           | TEXT                                      | Optional                 |
| status          | ENUM(active, completed, cancelled)        | Default: active          |
| created_at      | TIMESTAMP                                 |                          |
| updated_at      | TIMESTAMP                                 | Auto-updated via trigger |

### bookings
| Column       | Type                                     | Notes                          |
|--------------|------------------------------------------|--------------------------------|
| booking_id   | VARCHAR(36) PK                           | UUID                           |
| ride_id      | VARCHAR(36) FK → rides ON DELETE CASCADE |                                |
| user_id      | VARCHAR(36) FK → users ON DELETE CASCADE |                                |
| seats_booked | INT CHECK > 0                            |                                |
| status       | ENUM(confirmed, cancelled)               | Default: confirmed             |
| created_at   | TIMESTAMP                                |                                |
| updated_at   | TIMESTAMP                                | Auto-updated via trigger       |

> Unique constraint on `(ride_id, user_id)` prevents a rider from booking the same ride twice.

---

## Prerequisites

- Node.js 18+
- AWS account (region `us-east-2`) with the following already provisioned:
  - Cognito User Pool with `USER_PASSWORD_AUTH` and `custom:role` attribute
  - Aurora PostgreSQL 17.7 Serverless v2 with Internet Access Gateway + IAM auth
  - ElastiCache Redis Serverless (TLS on port 6379)
  - S3 bucket with public access unblocked and CORS configured
  - SNS Standard topics: `carpooling-bookings` and `carpooling-cancellations`
  - IAM user with `rds-db:connect`, S3, SNS, Cognito, CloudWatch permissions
  - CloudWatch alarms (created via `cloudwatch-setup.js`)

---

## AWS Services & Resources

| Service | Resource | Notes |
|---------|----------|-------|
| **Cognito** | User Pool `us-east-2_XUAFYEpOn` | `USER_PASSWORD_AUTH`, `custom:role` string attribute |
| **Aurora PostgreSQL** | Cluster `database-1` | Serverless v2, 0–4 ACUs, IAM auth, Internet Access Gateway |
| **ElastiCache** | `carpooling-redis` (Serverless) | Redis 7.1, TLS required, VPC-only access |
| **S3** | `carpooling-profile-photos-595319278116` | Public-read ACL, CORS for GET/PUT/POST |
| **SNS** | `carpooling-bookings` | Booking created & ride posted events |
| **SNS** | `carpooling-cancellations` | Booking cancelled & ride cancelled events |
| **CloudWatch** | 4 alarms | CPU, DB connections, Redis evictions, 5xx errors |

### CloudWatch Alarms

| Alarm | Metric | Threshold |
|-------|--------|-----------|
| `CarpoolingAPI-HighCPU` | EC2 CPUUtilization | > 80% for 10 min |
| `CarpoolingDB-HighConnections` | RDS DatabaseConnections | > 80 |
| `CarpoolingCache-HighEvictions` | ElastiCache Evictions | > 100 per 5 min |
| `CarpoolingAPI-5xxErrors` | ALB HTTPCode_Target_5XX_Count | > 10 per 3 min |

---

## Environment Variables

All values go in `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# AWS Region & Credentials (IAM user: carpooling-dev)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Aurora PostgreSQL (IAM auth — no password needed at runtime)
DB_HOST=database-1.cluster-xxxxxxxxxx.us-east-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=

# ElastiCache Redis Serverless (TLS auto-enabled when host != localhost)
REDIS_HOST=carpooling-redis-xxxxxx.serverless.use2.cache.amazonaws.com
REDIS_PORT=6379
REDIS_TTL=300

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-2_xxxxxxxxx
COGNITO_CLIENT_ID=your_cognito_app_client_id
COGNITO_REGION=us-east-2

# S3
S3_BUCKET_NAME=carpooling-profile-photos-your_account_id
S3_REGION=us-east-2

# SNS
SNS_TOPIC_ARN_BOOKINGS=arn:aws:sns:us-east-2:your_account_id:carpooling-bookings
SNS_TOPIC_ARN_CANCELLATIONS=arn:aws:sns:us-east-2:your_account_id:carpooling-cancellations

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> `DB_PASSWORD` is left empty because the backend authenticates using IAM tokens generated by `@aws-sdk/rds-signer`. A fresh token is fetched automatically for each new connection.

---

## Running the Project

### 1. Load the database schema

Run once using AWS CloudShell (the cluster requires IAM auth — password auth is blocked by the Internet Access Gateway):

```bash
# In AWS CloudShell
export RDSHOST="your-cluster-endpoint.us-east-2.rds.amazonaws.com"
export PGPASSWORD=$(aws rds generate-db-auth-token \
  --hostname $RDSHOST --port 5432 --username postgres --region us-east-2)
psql "host=$RDSHOST port=5432 dbname=postgres user=postgres sslmode=require" \
  -f database/schema.sql
```

This creates the 3 tables, triggers, indexes, and seeds the admin user (`admin@carpooling.com`).

### 2. Run infrastructure setup (one-time)

```bash
cd backend
npm install

# From backend/ so the AWS SDKs are available
node ../infrastructure/sns-setup.js
node ../infrastructure/s3-setup.js
node ../infrastructure/cloudwatch-setup.js
```

### 3. Start the backend

```bash
cd backend
npm run dev       # nodemon — restarts on file changes
npm start         # node — production
```

Backend runs at `http://localhost:3000`.  
Health check: `GET /health` → `{ "status": "ok", "timestamp": "..." }`

> **Note on Redis:** ElastiCache Serverless is VPC-only. In local development the Redis connection times out and the server logs a warning, then continues without caching. All cache operations fall back to the database transparently.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Vite proxies `/auth`, `/rides`, `/bookings`, `/users`, `/admin` to `http://localhost:3000`.

---

## API Reference

### Auth — `/auth`

| Method | Path                  | Auth   | Description                               |
|--------|-----------------------|--------|-------------------------------------------|
| POST   | /auth/register        | Public | Register: name, email, password, role     |
| POST   | /auth/confirm         | Public | Verify email with Cognito 6-digit code    |
| POST   | /auth/login           | Public | Login → idToken, accessToken, refreshToken|
| POST   | /auth/forgot-password | Public | Send password reset code to email         |
| POST   | /auth/reset-password  | Public | Reset password with confirmation code     |

### Rides — `/rides`

| Method | Path                    | Auth   | Description                               |
|--------|-------------------------|--------|-------------------------------------------|
| GET    | /rides/search           | Public | Search rides with filters (Redis cached)  |
| GET    | /rides/driver/my        | Driver | Driver's own rides with booking counts    |
| GET    | /rides/:rideId          | Public | Single ride with driver info              |
| POST   | /rides                  | Driver | Post a new ride                           |
| PATCH  | /rides/:rideId/cancel   | Driver | Cancel ride, notify all booked riders     |

### Bookings — `/bookings`

| Method | Path                    | Auth   | Description                               |
|--------|-------------------------|--------|-------------------------------------------|
| POST   | /bookings               | Rider  | Book seats (PostgreSQL FOR UPDATE)        |
| POST   | /bookings/cancel        | Rider  | Cancel booking, restore seats             |
| GET    | /bookings/my            | Rider  | Rider's own bookings                      |
| GET    | /bookings/ride/:rideId  | Driver | All confirmed bookings for a ride         |

### Users — `/users`

| Method | Path                       | Auth | Description                           |
|--------|----------------------------|------|---------------------------------------|
| GET    | /users/me                  | Any  | Get own profile                       |
| PATCH  | /users/me                  | Any  | Update name and/or phone              |
| POST   | /users/me/photo            | Any  | Upload profile photo to S3 (multipart)|
| GET    | /users/me/photo-upload-url | Any  | Get presigned S3 PUT URL              |

### Admin — `/admin`

| Method | Path                            | Auth  | Description                        |
|--------|---------------------------------|-------|------------------------------------|
| GET    | /admin/stats                    | Admin | Platform stats (Redis cached 1 min)|
| GET    | /admin/users                    | Admin | All users with pagination          |
| PATCH  | /admin/users/:userId/deactivate | Admin | Deactivate a user                  |
| PATCH  | /admin/users/:userId/activate   | Admin | Reactivate a user                  |
| GET    | /admin/rides                    | Admin | All rides with status filter       |
| DELETE | /admin/rides/:rideId            | Admin | Hard-delete a ride                 |

---

## Notifications Flow

### When a rider books a seat
```
POST /bookings
  → PostgreSQL transaction commits (seats_available decremented)
  → SNS publish to carpooling-bookings
      Payload: { type: BOOKING_CREATED, driver, rider, ride, seatsBooked }
```

### When a rider cancels a booking
```
POST /bookings/cancel
  → PostgreSQL transaction commits (seats_available restored)
  → SNS publish to carpooling-cancellations
      Payload: { type: BOOKING_CANCELLED, driver, rider, ride, seatsBooked }
```

### When a driver cancels a ride
```
PATCH /rides/:id/cancel
  → Ride status → 'cancelled'
  → Redis cache invalidated for source+destination pattern
  → Query all confirmed bookings for this ride
  → SNS publish to carpooling-cancellations for EACH booked rider
      Payload: { type: BOOKING_CANCELLED, driver, rider, ride, seatsBooked }
```

> SNS failures are non-fatal — all `notify*` calls are wrapped in try/catch so a notification error never blocks the booking or cancellation response.

---

## Caching Strategy

Ride search results cached in Redis under a composite key:

```
rides:{source}:{destination}:{date}:{minPrice}:{maxPrice}
```

| Event                 | Cache action                                       |
|-----------------------|----------------------------------------------------|
| Search request        | Return cached result if key exists (TTL 5 min)     |
| Driver posts a ride   | Invalidate keys matching `rides:{source}:{dest}:*` |
| Driver cancels a ride | Invalidate keys matching `rides:{source}:{dest}:*` |
| Rider books a seat    | Invalidate keys matching `rides:{source}:{dest}:*` |
| Admin stats request   | Cached under `admin:stats` (TTL 1 min)             |

Cache failures are silently ignored — the app falls back to the database with no user-visible impact.

> In local development, ElastiCache is unreachable (VPC-only). The connection times out, a warning is logged, and the server continues with DB-only mode.

---

## Monitoring & Logging

### Application Logging (Winston)

Structured JSON logs written to:
- `logs/error.log` — error-level only
- `logs/combined.log` — all levels

Sample log entry:
```json
{
  "level": "error",
  "message": "...",
  "service": "carpooling-api",
  "timestamp": "2026-04-30T16:25:00.000Z",
  "path": "/bookings",
  "method": "POST",
  "stack": "..."
}
```

Human-readable colorized output is also printed to the console in development.

> In production, configure the CloudWatch agent to tail `logs/combined.log` and ship to a CloudWatch Logs log group.

---

## Phase Implementation

| Phase | Features | Status |
|-------|----------|--------|
| **Phase 1** — Basic Setup | Cognito auth (register, confirm, login, forgot/reset), driver ride posting, rider ride browsing | ✅ Complete |
| **Phase 2** — Booking & Notifications | Atomic seat booking (PostgreSQL FOR UPDATE), SNS notifications to driver on booking, SNS confirmation to rider, ride/booking cancellation alerts | ✅ Complete |
| **Phase 3** — Search, Cache & Dashboard | Multi-filter ride search, ElastiCache Redis caching with auto-invalidation, admin dashboard with stats and management, CloudWatch alarms + Winston logging | ✅ Complete |

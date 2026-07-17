# RentConnect 🏠

> **A production-grade, broker-free rental platform connecting flat owners and tenants directly — built as a startup MVP, not a college project.**

[![Frontend](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-brightgreen?style=flat-square&logo=vercel)](https://rentconnect-frontend-delta.vercel.app)
[![Backend](https://img.shields.io/badge/Backend%20API-Live%20on%20Vercel-brightgreen?style=flat-square&logo=vercel)](https://rentconnect-backend.vercel.app/health)
[![GitHub](https://img.shields.io/badge/GitHub-Karan--desai--7299%2FRentConnect--blue?style=flat-square&logo=github)](https://github.com/Karan-desai-7299/RentConnect-)
[![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)](LICENSE)

---

## 🔗 Live Links

| Resource | URL |
|---|---|
| 🌐 **Frontend Web App** | https://rentconnect-frontend-delta.vercel.app |
| 🔌 **Backend REST API** | https://rentconnect-backend.vercel.app |
| 🏥 **API Health Check** | https://rentconnect-backend.vercel.app/health |
| 📦 **GitHub Repository** | https://github.com/Karan-desai-7299/RentConnect- |

---

## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Security Implementations](#security-implementations)
- [Author](#author)

---

## About the Project

RentConnect is a full-stack MERN rental platform that removes the broker from the rental process. Tenants can discover nearby properties, schedule visits, chat with owners directly, and leave reviews. Owners get a business-grade dashboard with listing analytics, visit management, and automated listing expiry. Admins can moderate content, verify listings, and manage users.

The project was built to production standards — featuring JWT refresh token rotation, MongoDB geospatial aggregation, image compression pipelines, role-based access control, and a mobile-first responsive UI.

---

## ✨ Key Features

### For Tenants
- 🔍 **Smart Search** — Filter by city, property type, rent range, bedrooms, furnishing, amenities, and gender preference
- 📍 **Nearby Search** — Geolocation-based proximity search using MongoDB `$geoNear` — finds properties near you
- ❤️ **Favorites** — Save properties and revisit anytime from your dashboard
- 📅 **Visit Booking** — Schedule property visits with conflict detection (no double-booking)
- 💬 **Real-time Chat** — Direct messaging with owners via Socket.io (typing indicators, read receipts, unread counts)
- ⭐ **Reviews & Ratings** — Leave ratings and reviews after a confirmed visit
- 🕐 **Recently Viewed** — Last 10 viewed properties surfaced on home and dashboard
- 🔐 **Email Verification** — Account confirmed via email on registration

### For Owners
- 🏠 **Property Management** — Full CRUD with image upload (up to 10 images, auto-compressed via Sharp + ImageKit)
- 📊 **Analytics Dashboard** — Total views, active listings count, visit requests, unread booking count
- 🔄 **Status Toggle** — Switch listings between Active / Paused / Rented in one click
- 📆 **Booking Management** — Confirm or cancel visit requests, mark as read
- ⏰ **Auto-Expiry + Renew** — Listings auto-hidden after 60 days; owners get email alerts and a one-click renew

### For Admins
- 🛡️ **User Moderation** — Search users, ban/unban accounts, change roles
- ✅ **Property Verification** — Verify listings manually; verified badge shown to tenants
- 🗑️ **Report Handling** — Delete reported properties with full cascade (favorites, bookings, reviews, ImageKit files)
- 📈 **Dashboard Stats** — Platform-wide counts across users, properties, bookings, and reports

### Platform-Wide
- 🌙 **Dark Mode** — Full `data-theme` dark mode with localStorage persistence
- 📱 **Mobile-First UI** — 4-tier responsive CSS breakpoints, hamburger menu, bottom navigation
- 🔔 **Toast Notifications** — Custom toast system replacing all browser `alert()` calls
- ⚡ **Skeleton Loaders** — Shimmer placeholders while content loads
- ♿ **Accessibility** — `prefers-reduced-motion` CSS media query wrapping all animations

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI framework |
| React Router DOM | 7.17.0 | Client-side routing + lazy loading |
| Axios | 1.17.0 | HTTP client with refresh-token interceptor |
| Socket.io Client | 4.8.3 | Real-time messaging |
| Lucide React | 1.21.0 | Icon library |
| Vite | 8.0.12 | Build tool |
| Custom CSS | — | Design system (no Tailwind) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22+ | Runtime |
| Express | 5.2.1 | REST API framework |
| MongoDB + Mongoose | 9.6.3 | Database + ODM |
| Socket.io | 4.8.3 | Real-time WebSocket layer |
| JWT (jsonwebtoken) | 9.0.3 | Access + refresh tokens |
| bcryptjs | 3.0.3 | Password hashing |
| Sharp | 0.35.2 | Image resizing + compression |
| ImageKit | 6.0.0 | Cloud image storage |
| Nodemailer | 9.0.1 | Email (verification, reset, notifications) |
| Helmet | 8.2.0 | HTTP security headers |
| express-rate-limit | 8.5.2 | Brute-force protection |
| express-validator | 7.3.2 | Input validation |
| Multer | 2.1.1 | File upload middleware |
| Morgan | 1.11.0 | HTTP request logging |
| compression | 1.8.1 | Gzip compression |

---

## 📁 Project Structure

```
RentConnect/
├── Backend/
│   ├── server.js                    # Entry point, Socket.io init, DB connect
│   ├── Procfile                     # Render deployment config
│   ├── vercel.json                  # Vercel serverless config
│   ├── .env.example                 # Environment variable template
│   └── src/
│       ├── app.js                   # Express app, middleware, routes
│       ├── db/db.js                 # MongoDB connection
│       ├── controllers/
│       │   ├── auth.controller.js   # Register, login, refresh, verify, forgot/reset
│       │   ├── property.controller.js # CRUD, search, booking, reviews, favorites
│       │   ├── chat.controller.js   # Messages, conversations, unread count
│       │   └── admin.controller.js  # Dashboard, user mod, property verify
│       ├── models/
│       │   ├── user.model.js        # User schema (roles, refresh token, verification)
│       │   ├── property.model.js    # Property schema (geo, text index, compound indexes)
│       │   ├── booking.model.js     # Visit booking schema
│       │   ├── message.model.js     # Chat message schema
│       │   ├── favorite.model.js    # Favorites (unique compound index)
│       │   ├── review.model.js      # Reviews (unique per user-property)
│       │   └── report.model.js      # Property reports
│       ├── routes/
│       │   ├── auth.routes.js       # /api/v1/auth
│       │   ├── property.routes.js   # /api/v1/property
│       │   ├── user.routes.js       # /api/v1/user
│       │   ├── chat.routes.js       # /api/v1/chat
│       │   └── admin.routes.js      # /api/v1/admin
│       ├── middlewares/
│       │   ├── auth.middleware.js   # JWT protect + role authorize
│       │   └── validate.middleware.js # express-validator rules
│       ├── services/
│       │   ├── storage.service.js   # Sharp + ImageKit upload/delete
│       │   └── email.service.js     # Nodemailer templates
│       ├── socket/socket.js         # Socket.io events (JWT handshake, chat, typing)
│       ├── jobs/expiryCheck.js      # Daily listing expiry + owner emails
│       └── utils/
│           ├── apiResponse.js       # Standardized success/error responses
│           └── corsOrigins.js       # Dynamic CORS origin validation
│
└── Frontend/
    ├── index.html
    ├── vite.config.js
    ├── vercel.json                  # SPA rewrite rule
    ├── .env.example
    └── src/
        ├── main.jsx                 # React root
        ├── App.jsx
        ├── index.css                # Full custom CSS design system (1600+ lines)
        ├── context/
        │   ├── AuthContext.jsx      # Global auth state, token refresh
        │   └── SocketContext.jsx    # Socket.io connection management
        ├── services/api.js          # Axios instance + 401 refresh interceptor
        ├── hooks/useToast.js        # Toast notification hook
        ├── routes/
        │   ├── AppRoutes.jsx        # All routes with lazy loading + Suspense
        │   └── ProtectedRoute.jsx   # Role-aware route guard
        ├── layouts/MainLayout.jsx   # Topbar, hamburger menu, bottom nav, footer
        ├── pages/
        │   ├── Home/                # Hero, featured listings, recently viewed
        │   ├── Search/              # Filters, skeleton cards, pagination, map
        │   ├── PropertyDetails/     # Gallery, stats, WhatsApp, booking, reviews
        │   ├── Dashboard/           # Tenant bookings, favorites, recently viewed
        │   ├── Owner/               # Analytics, listings CRUD, status toggle
        │   ├── Admin/               # User management, reports, verification
        │   ├── Chat/                # Real-time messaging, pagination
        │   ├── Login/               # With "Forgot password?" link
        │   ├── Register/            # Role selection, profile image
        │   ├── ForgotPassword/      # Email input form
        │   ├── ResetPassword/       # Token-based password reset
        │   ├── VerifyEmail/         # Auto-verify on load
        │   ├── Profile/             # Edit profile + image
        │   ├── Favorites/           # Saved properties
        │   └── About/               # Platform info
        └── utils/
            ├── formatters.js        # formatMoney, formatDate helpers
            └── cities.js            # City list + normalizeCity
```

---

## 📡 API Reference

**Base URL:** `https://rentconnect-backend.vercel.app`
**All endpoints:** `/api/v1/`
**Auth:** Bearer token in `Authorization: Bearer <token>` header

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ✗ | Register new user (multipart: profileImage optional) |
| `POST` | `/login` | ✗ | Login → returns access token + sets refresh cookie |
| `POST` | `/logout` | ✗ | Clears refresh token cookie |
| `POST` | `/refresh` | ✗ | Issues new access token from httpOnly refresh cookie |
| `GET` | `/verify-email/:token` | ✗ | Confirms email address |
| `POST` | `/resend-verification` | ✗ | Resends verification email |
| `POST` | `/forgot-password` | ✗ | Sends password reset link to email |
| `POST` | `/reset-password/:token` | ✗ | Resets password using token from email |

**Register request body (multipart/form-data):**
```json
{
  "name": "Karansinh Desai",
  "email": "karan@example.com",
  "password": "min8chars",
  "phone": "9876543210",
  "role": "user | owner",
  "profileImage": "[file]"
}
```

**Login request body:**
```json
{ "email": "karan@example.com", "password": "yourpassword" }
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "_id": "...", "name": "Karansinh", "email": "...", "role": "user", "profileImage": "..." }
  }
}
```

---

### Properties — `/api/v1/property`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/` | ✗ | — | Search/browse properties (see query params below) |
| `GET` | `/:id` | ✗ | — | Get single property details + increment views |
| `POST` | `/` | ✓ | owner/admin | Create property (multipart: up to 10 images) |
| `PUT` | `/:id` | ✓ | owner/admin | Update property fields |
| `DELETE` | `/:id` | ✓ | owner/admin | Delete property + cascade favorites/bookings/reviews |
| `GET` | `/owner/analytics` | ✓ | owner/admin | Owner dashboard stats |
| `PUT` | `/:id/renew` | ✓ | owner/admin | Reset listing expiry to 60 days from now |
| `GET` | `/user/favorites` | ✓ | any | Get all favorited properties |
| `POST` | `/user/favorites/:propertyId` | ✓ | any | Toggle favorite on/off |
| `GET` | `/user/bookings` | ✓ | any | Get bookings (role-aware: tenant sees own, owner sees all theirs) |
| `PUT` | `/user/bookings/read` | ✓ | owner/admin | Mark all bookings as read |
| `POST` | `/:id/book` | ✓ | any | Schedule a visit (conflict check included) |
| `PUT` | `/bookings/:bookingId/confirm` | ✓ | owner/admin | Confirm a visit booking |
| `PUT` | `/bookings/:bookingId/cancel` | ✓ | owner/admin | Cancel a visit booking |
| `DELETE` | `/bookings/:bookingId` | ✓ | owner/admin | Delete a booking |
| `POST` | `/:id/report` | ✓ | any | Report a property listing |
| `GET` | `/:id/reviews` | ✗ | — | Get paginated reviews for a property |
| `POST` | `/:id/reviews` | ✓ | any | Submit a review (one per user per property) |

**GET `/` Query Parameters:**
```
city          string    Filter by city name (free text)
type          string    flat | room | pg | house | commercial
minRent       number    Minimum rent per month
maxRent       number    Maximum rent per month
bedrooms      number    Exact bedroom count
furnished     string    furnished | semi-furnished | unfurnished
amenities     string    Comma-separated: wifi,parking,gym,...
genderPref    string    any | male | female
isVerified    boolean   true — only show verified listings
sort          string    latest | lowest | highest | nearest
lat           number    Required for nearest sort (user latitude)
lng           number    Required for nearest sort (user longitude)
page          number    Page number (default: 1)
limit         number    Results per page (default: 12, max: 50)
```

**POST `/` request body (multipart/form-data):**
```
title, description, type, rent, deposit, bedrooms, bathrooms,
area, city, address, floor, totalFloors, furnished, amenities (JSON array),
genderPreference, contactNumber, lat, lng, images (up to 10 files)
```

---

### User — `/api/v1/user`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/profile` | ✓ | Get logged-in user's profile |
| `PUT` | `/profile` | ✓ | Update profile (multipart: profileImage optional) |
| `GET` | `/:id` | ✓ | Get any user by ID |

---

### Chat — `/api/v1/chat`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/conversations` | ✓ | List all conversations with latest message per contact |
| `GET` | `/history/:otherUserId` | ✓ | Paginated message history (query: `?before=messageId&limit=50`) |
| `GET` | `/unread-count` | ✓ | Total unread message count across all conversations |

> **Note:** Messages are sent via Socket.io events, not REST. REST endpoints are for reading history only.

**Socket.io Events (client → server):**
```
join          { userId }         — Register online presence
sendMessage   { receiverId, text } — Send a message (sender verified from JWT handshake)
typing        { receiverId }     — Typing indicator start
stopTyping    { receiverId }     — Typing indicator stop
markSeen      { senderId }       — Mark messages from sender as seen
```

**Socket.io Events (server → client):**
```
newMessage    { message object } — Incoming message
typing        { senderId }       — Other user is typing
stopTyping    { senderId }       — Other user stopped typing
messageSeen   { by: userId }     — Message was read
getOnlineUsers [userId array]    — Currently online user IDs
```

---

### Admin — `/api/v1/admin`

> All admin routes require `Authorization: Bearer <adminToken>` and role `admin`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Platform stats: total users, properties, bookings, reports |
| `GET` | `/users` | Paginated user list (query: `?search=name_or_email&role=user|owner`) |
| `PUT` | `/users/:id/ban` | Toggle ban status for a user |
| `PUT` | `/users/:id/role` | Change user role (body: `{ role: "user|owner|admin" }`) |
| `PUT` | `/property/:id/verify` | Mark property as verified |
| `DELETE` | `/property/:id` | Delete reported property + cascade |
| `DELETE` | `/reviews/:id` | Remove a review |

---

### Standard API Response Format

All endpoints return a consistent envelope:

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "Descriptive error message" }
```

---

## 💻 Local Setup

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (free tier works)
- ImageKit account (free tier: 20GB storage)
- Gmail account with App Password enabled (for emails)

### 1. Clone the repository
```bash
git clone https://github.com/Karan-desai-7299/RentConnect-.git
cd RentConnect-
```

### 2. Install dependencies
```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 3. Configure environment variables

Create `Backend/.env` — copy from `Backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/rentconnect
JWT_SECRET=your_64_char_hex_secret
JWT_REFRESH_SECRET=your_different_64_char_hex_secret
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

Create `Frontend/.env` — copy from `Frontend/.env.example`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_MAP_API=your_google_maps_api_key
```

> **Generate JWT secrets:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> Run twice — use different values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

> **Gmail App Password:** myaccount.google.com → Security → 2-Step Verification → App Passwords → Generate

### 4. Run development servers

```bash
# Terminal 1 — Backend (auto-restarts on file change)
cd Backend
npm run dev
# Server: http://localhost:5000

# Terminal 2 — Frontend
cd Frontend
npm run dev
# App: http://localhost:5173
```

### 5. Verify setup
- Backend health: http://localhost:5000/health → `{"status":"ok"}`
- Frontend: http://localhost:5173 → Home page loads

---

## 🌍 Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGO_URL` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens (64-char hex recommended) |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens (different from JWT_SECRET) |
| `IMAGEKIT_PUBLIC_KEY` | Yes | ImageKit public API key |
| `IMAGEKIT_PRIVATE_KEY` | Yes | ImageKit private API key |
| `IMAGEKIT_URL_ENDPOINT` | Yes | ImageKit URL endpoint (e.g. `https://ik.imagekit.io/your_id`) |
| `EMAIL_USER` | No* | Gmail address for sending emails |
| `EMAIL_PASS` | No* | Gmail App Password (16 chars) |
| `FRONTEND_URL` | Yes | Deployed frontend URL (for CORS + email links) |
| `GOOGLE_MAP_API` | No | Google Maps API key (for geocoding in Owner dashboard) |

*If `EMAIL_USER`/`EMAIL_PASS` are not set in development, email verification is skipped and accounts are auto-verified. In production, email is required for full functionality.

### Frontend (`Frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend API URL (e.g. `https://rentconnect-backend.vercel.app`) |
| `VITE_GOOGLE_MAP_API` | No | Google Maps key for map display in property details |

---

## 🚀 Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import repo on [vercel.com](https://vercel.com) → set **Root Directory** to `Frontend`
3. Add environment variable: `VITE_API_BASE_URL = https://your-backend-url.vercel.app`
4. Deploy — Vercel auto-detects Vite

The `Frontend/vercel.json` handles React Router SPA routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### Backend → Vercel (REST only, no real-time chat)

1. Import same repo → set **Root Directory** to `Backend`
2. Add all backend environment variables in Vercel dashboard
3. `Backend/vercel.json` handles serverless routing
4. Socket.io is automatically disabled (`VERCEL=1` env var detected)

### Backend → Render (Full Socket.io support — recommended)

`render.yaml` is already configured:
```bash
# In Render dashboard:
# New → Blueprint → connect GitHub repo → Render reads render.yaml
# Add env vars manually (marked sync: false in render.yaml)
```

> **Note:** Render free tier sleeps after 15 minutes of inactivity. First request may take ~30 seconds to wake up.

### MongoDB Atlas Network Access

For production, allow Vercel/Render IPs:
- Atlas dashboard → Network Access → Add IP Address → `0.0.0.0/0` (allow all)

---

## 🔒 Security Implementations

| Security Feature | Implementation |
|---|---|
| **Password hashing** | bcryptjs with salt rounds 10 |
| **JWT access tokens** | 15-minute expiry, signed with separate secret |
| **JWT refresh tokens** | 7-day expiry, hashed (SHA-256) before DB storage, httpOnly cookie |
| **Role hardcoding** | `role: "user"` hardcoded on registration — cannot be escalated via API |
| **Socket authentication** | JWT verified on Socket.io handshake, `socket.userId` set server-side |
| **Input validation** | express-validator on register, login, property create, booking |
| **CORS guard** | Dynamic origin check — allows localhost, `*.vercel.app`, and `FRONTEND_URL` only |
| **HTTP security headers** | Helmet.js — XSS protection, content-type sniffing, clickjacking protection |
| **Rate limiting** | 10 requests/15 min on `/auth/login`, `/auth/register`, `/auth/forgot-password` |
| **Cascade deletes** | Property delete removes Favorites, Bookings, Reviews + ImageKit files |
| **Admin gating** | `isVerifiedProperty` always starts `false`; only admin can set it `true` |
| **Email verification** | Crypto token, hashed before storage, 24-hour expiry |
| **Password reset** | Crypto token, hashed before storage, 1-hour expiry |
| **Secret isolation** | `.env` excluded from git via `.gitignore`; never committed |

---

## 📊 Database Indexes

Key indexes for query performance:

```js
// Property
{ city: 1, listingStatus: 1 }        // most common search filter
{ ownerId: 1, listingStatus: 1 }      // owner dashboard
{ rent: 1 }                           // price sort
{ createdAt: -1 }                     // latest sort
{ location: "2dsphere" }              // geospatial $geoNear
{ title: "text", description: "text", area: "text", address: "text" }  // text search

// Message
{ sender: 1, receiver: 1, createdAt: -1 }
{ receiver: 1, seen: 1 }              // unread count

// Review
{ userId: 1, propertyId: 1 }  (unique) // one review per user per property

// Booking
{ propertyId: 1, visitDate: 1, visitTime: 1 }  // conflict detection

// Favorite
{ userId: 1, propertyId: 1 }  (unique) // prevent duplicate favorites
```

---

## 📸 Screenshots

> *(Add screenshots of Home, Search, Property Details, Owner Dashboard, and Chat here)*

---

## 🤝 Contributing

This project is built as a portfolio showcase. Issues and suggestions are welcome via GitHub Issues.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Karansinh Desai**
3rd Year CSE Student — Dr. Babasaheb Ambedkar Technological University (DBATU), Lonere

[![LinkedIn](https://img.shields.io/badge/LinkedIn-karansinh--desai-blue?style=flat-square&logo=linkedin)](https://linkedin.com/in/karansinh-desai-a249a0289)
[![GitHub](https://img.shields.io/badge/GitHub-Karan--desai--7299-black?style=flat-square&logo=github)](https://github.com/Karan-desai-7299)

---

*Built to startup standard — not a college project.*

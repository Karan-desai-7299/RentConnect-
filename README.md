# RentConnect — Direct MERN Rental Platform (Startup MVP)

RentConnect is a production-grade, broker-free rental platform built on the MERN stack. Designed to feel like a real startup MVP rather than a college project, it facilitates direct peer-to-peer rental transactions between flat owners and tenants with real-time communications, secure role-based access, and geolocation proximity matching.

## 🚀 Key Features

*   **Verified Direct Listings:** Sub-minute rental property listing uploads (flat, room, PG, house) with image compressing pipelines.
*   **Secure Role-Based Auth:** Distinct workflows for Tenants (wishlists, scheduling visits, writing reviews), Owners (analytics, bookings management, status toggles), and Admins (user moderation, verification, cascade deletes).
*   **Proximity-Based Search:** Native MongoDB `$geoNear` 2D sphere geospatial queries matched with text indexes for sub-second, highly relevant searching.
*   **Real-Time Chat:** Bidirectional Socket.io messaging with JWT connection-level handshakes, typing indicators, read receipts, and actual unread count numbers.
*   **Automatic Listing Expiry:** Daily background checks auto-hiding properties after 60 days of activity, coupled with owner notification template alerts.
*   **Rich Startup UI:** Sleek glassmorphic card design system built in React 19, incorporating skeletons, custom Toast system, prefers-reduced-motion accessibility, and data-theme dark mode overrides.

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **Core:** React 19, React Router DOM v7 (Lazy loaded views with Suspense)
- **Styling:** Custom CSS design system, Outfit typography, Lucide React icons
- **State & HTTP:** React Context, Axios instance with 401 automatic token-refresh interceptor

### Backend
- **Framework:** Node.js, Express 5 (Versioned REST API under `/api/v1`)
- **Database:** MongoDB Atlas, Mongoose ODM
- **Real-Time:** Socket.io
- **Security Middleware:** Helmet, Express Rate Limit, Cookie Parser
- **Integrations:** Sharp (image resizing/compression), ImageKit (file uploads), Nodemail (emails)

---

## 🔒 Enterprise-Grade Security Fixes (Implemented)
1.  **Secret Isolation:** Removed all hardcoded MongoDB, JWT, and API credentials from VCS commits; enforced `.gitignore` security scopes.
2.  **CORS Guard:** Configured strict, dynamic CORS origin validations restricting unauthorized socket/REST access.
3.  **Role Privilege Escapes:** Hardcoded safe default roles on registration; removed API parameter role injection vulnerabilities.
4.  **Socket Identity Handshake:** Implemented JWT verification on Socket.io connection handshake; verified user identification server-side to prevent spoofing.
5.  **Cascading Deletes:** Upgraded deletion queries to securely cascade across Favorites, Bookings, Reviews, and third-party ImageKit storage IDs.
6.  **Admin Verification Gating:** Restricted property listing verifications to admin PUT routes; prevented owner self-verifications.
7.  **Axios Interceptor Deduping:** Consolidated global interceptor setups to prevent request leaks and loop vulnerabilities.

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local instance

### 1. Clone & Install Dependencies

```bash
# Backend installation
cd Backend
npm install

# Frontend installation
cd ../Frontend
npm install
```

### 2. Configure Environment Variables

Create `.env` files in both directories based on the provided templates:

#### Backend (`Backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/rentconnect
JWT_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
EMAIL_USER=your_gmail_username@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

#### Frontend (`Frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_MAP_API=your_google_maps_api_key_here
```

### 3. Run Development Servers

```bash
# In Backend directory
npm run dev

# In Frontend directory
npm run dev
```

- **Backend server:** `http://localhost:5000`
- **Frontend app:** `http://localhost:5173`

---

## 📝 Author & Footer
Developed and upgraded by **Karansinh Desai**.
*Built to modern startup standard for resume showcase.*

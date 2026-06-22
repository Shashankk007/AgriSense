# AgriSense Backend

This folder contains the Node.js/Express API for AgriSense. It handles authentication, farm management, file uploads, database access, and server-side validation.

## What this backend does

- Authenticates users with email/password and Google login
- Issues and refreshes JWT access tokens
- Stores user and farm data in MongoDB
- Saves and manages farm boundaries
- Uploads profile images and other media to Cloudinary
- Provides reusable middleware and utility helpers

## Folder Structure

### `server.js`
Main entry point for the backend application.

Responsibilities:
- Loads environment variables
- Connects to MongoDB
- Configures Express middleware such as CORS, JSON parsing, cookies, and security headers
- Registers API routes
- Returns a 404 for unknown routes
- Handles global errors
- Starts the server

### `controllers/`
Contains the main request handlers where business logic lives.

- `user-controller.js`
  - Register users
  - Login users with email/password
  - Logout users
  - Refresh access tokens
  - Change password
  - Update profile image
  - Get current user data

- `farm-controller.js`
  - Create a farm boundary
  - Calculate farm area with Turf.js
  - List farms for a user
  - Get one farm by ID
  - Delete a farm

### `routes/`
Defines API endpoints and connects them to controllers and middleware.

- `authRoutes.js`
  - `POST /api/auth/login`
  - `POST /api/auth/google-login`
  - `POST /api/auth/refresh-token`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`

- `farmRoutes.js`
  - `POST /api/farms/save-boundary`
  - `GET /api/farms`
  - `GET /api/farms/:id`
  - `DELETE /api/farms/:id`

### `middlewares/`
Reusable request middleware.

- `isLoggerIn.js`
  - Protects routes that require authentication
  - Reads JWT from cookies or authorization headers
  - Attaches the authenticated user to `req.user`

- `multer.js`
  - Handles file upload configuration
  - Used for profile images or other media uploads

### `models/`
Mongoose schemas for MongoDB collections.

- `User.js` 
- `Farm.js`
- `Crop.js`
- `CropHealth.js`
- `DiseaseDetection.js`
- `Inventory.js`
- `PestDetection.js`
- `SatellitData.js`
- `YieldPrediction.js`

These models represent the stored data for users, farms, crop analysis, inventory, and prediction records.

### `utils/`
Shared helper modules used across the backend.

- `db.js`
  - Connects the app to MongoDB

- `apiError.js`
  - Custom error class for consistent API errors

- `wrapAsync.js`
  - Wraps async route handlers so errors go to the global error handler

- `cloudinary.js`
  - Cloudinary configuration

- `uploadPhoto.js`
  - Helper for uploading images

- `uploadProfileImage.js`
  - Specialized helper for profile image uploads

## Environment Variables

Typical variables used by this backend include:

- `PORT`
- `MONGO_URL`
- `CLIENT_URL`
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRY`
- `GOOGLE_CLIENT_ID`
- Cloudinary-related credentials

## Run the backend

```bash
npm install
npm run dev
```

For production:

```bash
npm start
```

## Notes

- Keep `.env` private.
- Keep Cloudinary and database credentials out of version control.
- The server expects the MongoDB connection to be available before most features work.

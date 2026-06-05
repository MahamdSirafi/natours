```markdown
# Natours App - Tour Booking Application

A full-stack web application for managing and booking tours, built with **Node.js**, **Express**, and **MongoDB**. It features a server-side rendered frontend using **Pug** and a RESTful API.

---

## Technologies Used

| Technology       | Purpose                          |
|------------------|----------------------------------|
| **Node.js** (>= 8.3.0) | JavaScript runtime         |
| **Express**      | Web framework for building APIs |
| **MongoDB**      | NoSQL database                   |
| **Mongoose**     | ODM for MongoDB                  |
| **Pug**          | Template engine for views        |
| **Stripe**       | Payment processing               |
| **Mapbox**       | Maps and tour location display   |
| **JWT**          | Authentication                   |
| **Nodemailer / Mailtrap** | Email sending (password reset, etc.) |
| **Bcryptjs**     | Password hashing                 |
| **Sharp**        | Image processing                 |
| **Cloudinary**   | Optional image upload            |

---

## Database Schema

The project consists of **4 main models**:

### 1️⃣ Tour

| Field              | Type                       | Description |
|--------------------|----------------------------|-------------|
| `name`             | String                     | Unique, 10‑40 characters |
| `slug`             | String                     | URL-friendly name |
| `duration`         | Number                     | Duration in days |
| `maxGroupSize`     | Number                     | Maximum group size |
| `difficulty`       | String                     | `easy`, `medium`, `difficult` |
| `ratingsAverage`   | Number                     | Average rating (1‑5) |
| `ratingsQuantity`  | Number                     | Number of ratings |
| `price`            | Number                     | Price |
| `priceDiscount`    | Number                     | Discount (must be less than price) |
| `summary`          | String                     | Short summary |
| `description`      | String                     | Full description |
| `imageCover`       | String                     | Cover image |
| `images`           | [String]                   | Array of images |
| `startDates`       | [Date]                     | Available start dates |
| `startLocation`    | GeoJSON                    | Starting point (map) |
| `locations`        | [GeoJSON]                  | Stops along the tour |
| `guides`           | [ObjectId → User]          | Guides assigned to the tour |
| `secretTour`       | Boolean                    | Secret tour (for testing) |
| `createdAt`        | Date                       | Creation date |

**Virtuals:**
- `durationWeeks` – duration in weeks
- `reviews` – all reviews for this tour

**Indexes:**
- `{ price: 1, ratingsAverage: -1 }`
- `{ slug: 1 }`
- `{ startLocation: '2dsphere' }` – for geospatial queries

---

### 2️⃣ User

| Field                  | Type                       | Description |
|------------------------|----------------------------|-------------|
| `name`                 | String                     | Full name |
| `email`                | String                     | Unique email |
| `photo`                | String                     | Profile picture (default: `default.jpg`) |
| `role`                 | String                     | `admin`, `guide`, `lead-guide`, `user` |
| `password`             | String                     | Hashed with bcrypt |
| `passwordConfirm`      | String                     | Password confirmation (not persisted) |
| `passwordChangedAt`    | Date                       | Last password change timestamp |
| `passwordResetToken`   | String                     | Token for password reset |
| `passwordResetExpires` | Date                       | Token expiry |
| `active`               | Boolean                    | Account active? |
| `logInTimes`           | Number                     | Failed login attempts (security) |
| `bannedForHour`        | Date                       | Temporary ban timestamp |

**Middleware:**
- Auto‑hash password before save
- Exclude password from queries
- Ignore inactive accounts
- Ban user for 1 hour after 10 failed login attempts

---

### 3️⃣ Review

| Field       | Type                 | Description |
|-------------|----------------------|-------------|
| `review`    | String               | Review text |
| `rating`    | Number               | 1‑5 rating |
| `createdAt` | Date                 | Review date |
| `tour`      | ObjectId → Tour      | Tour being reviewed |
| `user`      | ObjectId → User      | User who wrote the review |

**Features:**
- Unique compound index `{ tour: 1, user: 1 }` – one review per user per tour
- Automatically updates tour's average rating on create/update/delete

---

### 4️⃣ Booking

| Field       | Type                 | Description |
|-------------|----------------------|-------------|
| `tour`      | ObjectId → Tour      | Booked tour |
| `user`      | ObjectId → User      | User who booked |
| `price`     | Number               | Paid amount |
| `paid`      | Boolean              | Payment status (default: `true`) |
| `createdAt` | Date                 | Booking date |

---

## How to Run the Project for the First Time

### 1. Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Community Edition) or a [MongoDB Atlas](https://www.mongodb.com/atlas) cloud account
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (optional – for local webhook testing)

Verify installations:

```bash
node --version
npm --version
```

### 2. Download and Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the provided `.env.exp` file to `.env` and adjust the values:

```bash
NODE_ENV=development
PORT=7000
DB=mongodb://127.0.0.1:27017/natours
JWT_SECRET_KEY=your_secret_key_here
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
```

**If using MongoDB Atlas:** replace `DB` with your cloud connection string (including password).

**Email setup (optional):** Use [Mailtrap](https://mailtrap.io/) for local testing. Add SMTP credentials to `.env`:
`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`

### 4. Configure Stripe for Payments

1. Create a [Stripe](https://stripe.com/) account.
2. Get your API keys from the dashboard:
   - `STRIPE_SECRET_KEY` (starts with `sk_test_`)
   - `STRIPE_WEBHOOK_SECRET_KEY` (starts with `whsec_`)
3. Add them to `.env`.
4. **To test payments locally with webhooks:**
   ```bash
   # Install Stripe CLI (once)
   npm i -g @stripe/cli

   # Log in with your Stripe account
   stripe login --api-key sk_test_XXXXX

   # Forward webhooks to your local server
   stripe listen --forward-to localhost:7000/webhook-checkout
   ```
   After running the command, you’ll see a `whsec_...` key – that’s your `STRIPE_WEBHOOK_SECRET_KEY`. Add it to `.env`.

### 5. Seed the Database

The project includes sample tours, users, and reviews:

```bash
# Import data
node ./dev-data/data/import-dev-data.js --import

# Delete all data (if needed)
node ./dev-data/data/import-dev-data.js --delete
```

### 6. Run the Application

```bash
# Development mode (auto‑restart with nodemon)
npm run start:dev

# Production mode
npm run start:prod

# Normal start
npm start
```

Once the server starts, you’ll see `DB connection succeeded` and `Example app listening on port 7000`.

Open your browser at: http://localhost:7000

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm start` | Start the server |
| `npm run start:dev` | Start with nodemon (auto‑restart) |
| `npm run start:prod` | Start in production mode |
| `npm run build:js` | Build frontend JavaScript with esbuild |
| `npm run watch:js` | Watch JS changes and rebuild automatically |

---

## Project Structure

```
natours/
├── app.js                  # Express app setup
├── server.js               # Entry point (DB connection + server)
├── controllers/            # Route logic
│   ├── authController.js   # Authentication (signup/login/protect)
│   ├── bookingController.js # Bookings and payments
│   ├── errorController.js  # Global error handling
│   ├── handlerFactory.js   # Generic CRUD handlers
│   ├── reviewController.js # Reviews
│   ├── tourController.js   # Tours
│   ├── userController.js   # Users
│   └── viewController.js   # Page rendering (Pug)
├── models/                 # Mongoose models
│   ├── bookingModel.js
│   ├── reviewModel.js
│   ├── tourModel.js
│   └── userModel.js
├── routes/                 # Route definitions
├── views/                  # Pug templates
├── public/                 # Static assets (CSS, JS, images)
├── dev-data/               # Sample data
│   └── data/
│       ├── import-dev-data.js  # Data import script
│       ├── tours.json
│       ├── users.json
│       └── reviews.json
└── utils/                  # Helper utilities
    ├── apiFeatures.js      # Pagination, filtering, sorting
    ├── appError.js         # Custom error class
    ├── catchAsync.js       # Async error wrapper
    └── email.js            # Email sending
```

---

## API Endpoints

### Tours
- `GET /api/v1/tours` – Get all tours
- `GET /api/v1/tours/:id` – Get a specific tour
- `POST /api/v1/tours` – Create a tour
- `PATCH /api/v1/tours/:id` – Update a tour
- `DELETE /api/v1/tours/:id` – Delete a tour
- `GET /api/v1/tours/top-5-cheap` – Top 5 cheapest tours
- `GET /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit` – Tours within a radius
- `GET /api/v1/tours/distances/:latlng/unit/:unit` – Distances from a point

### Users
- `POST /api/v1/users/signup` – Register a new user
- `POST /api/v1/users/login` – Log in
- `POST /api/v1/users/forgotPassword` – Forgot password
- `PATCH /api/v1/users/resetPassword/:token` – Reset password

### Reviews
- `GET /api/v1/reviews` – Get all reviews
- `POST /api/v1/reviews` – Create a review

### Bookings
- `GET /api/v1/bookings` – Get all bookings
- `POST /api/v1/bookings` – Create a booking

---

## Stripe Test Cards

- **Success:** `4242 4242 4242 4242`
- **Failure:** `4000 0000 0000 0002`
- Any future expiry date (MM/YY) and any 3‑digit CVC

---

## Author

Developed by **Mohammed Adel Seirafi**

Repository: [natours on GitHub](https://github.com/MahamdSirafi/natours)
```

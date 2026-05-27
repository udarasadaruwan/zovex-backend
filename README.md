<div align="center">

# Zovex Backend

Modern ecommerce REST API for Zovex, built with Express, MongoDB, JWT auth, Stripe Checkout, Cloudinary media uploads, and role-based dashboards.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

</div>

## Overview

Zovex Backend powers the server side of a marketplace-style ecommerce platform. It handles authentication, product catalog management, shopping carts, orders, payments, uploads, reviews, profile management, and dashboards for users, sellers, and admins.

The API is designed around clean Express modules: routes call controllers, controllers delegate business logic to services, and Mongoose models keep data access predictable.

## Highlights

- JWT authentication with secure cookie support
- Local login, registration, logout, and password reset OTP flow
- Google OAuth 2.0 login through Passport
- Role-based access control for `user`, `seller`, and `admin`
- Product and category management
- Seller-owned product listings
- Shopping cart and order workflows
- Stripe Checkout session creation and payment confirmation
- Cloudinary image upload and deletion support
- Product reviews with per-user uniqueness
- Dashboard analytics for admins, sellers, and users
- Centralized async error handling and API error responses
- SMTP-backed emails with development preview mode

## Tech Stack

| Layer | Tools |
| --- | --- |
| Runtime | Node.js, ES modules |
| API | Express, CORS, Cookie Parser, Morgan |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs, Passport Google OAuth |
| Payments | Stripe Checkout |
| Media | Multer, Cloudinary |
| Email | Nodemailer |
| Development | Nodemon, dotenv |

## Project Structure

```text
src/
  app.js                  Express app, middleware, and API mounting
  server.js               Database connection and HTTP server startup
  config/                 MongoDB, Passport, Stripe, Cloudinary setup
  controllers/            HTTP request and response handlers
  middleware/             Auth, upload, and error middleware
  models/                 Mongoose schemas
  routes/                 API route definitions
  services/               Business logic for auth, cart, orders, payments, email, media
  utils/                  Shared API error and async helpers
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB connection string
- Optional service keys for Stripe, Cloudinary, Google OAuth, and SMTP

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

EMAIL_FROM=Zovex <no-reply@zovex.local>

# Local/dev SMTP. Some cloud hosts block SMTP ports in production.
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_PREVIEW=true

# Production HTTPS email options. Configure one when SMTP is blocked.
GMAIL_API_CLIENT_ID=your-google-oauth-client-id
GMAIL_API_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_API_REFRESH_TOKEN=your-google-oauth-refresh-token
GMAIL_API_USER=me
BREVO_API_KEY=xkeysib-your-brevo-api-key
BREVO_SENDER_NAME=Zovex
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_WEBHOOK_URL=https://your-email-webhook.example.com/send
EMAIL_WEBHOOK_SECRET=replace-with-a-shared-secret
```

Only `MONGO_URI` and `JWT_SECRET` are essential for the core API. Stripe, Cloudinary, Google OAuth, and email features need their matching keys before those specific routes can work fully. For deployed email on Render, prefer `GMAIL_API_REFRESH_TOKEN` or `BREVO_API_KEY` because they use HTTPS instead of SMTP.

### Run Locally

```bash
npm run dev
```

The API will start at:

```text
http://localhost:5000
```

Health check:

```http
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "zovex-api"
}
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Nodemon |
| `npm start` | Start the API with Node |

## API Routes

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a local account |
| `POST` | `/api/auth/login` | Public | Sign in with email and password |
| `POST` | `/api/auth/logout` | Public | Clear the auth session |
| `POST` | `/api/auth/forgot-password` | Public | Send a password reset OTP |
| `POST` | `/api/auth/reset-password` | Public | Reset password using OTP |
| `GET` | `/api/auth/me` | Authenticated | Get the current user |
| `GET` | `/api/auth/google` | Public | Start Google OAuth |
| `GET` | `/api/auth/google/callback` | Public | Handle Google OAuth callback |
| `GET` | `/api/auth/google/failure` | Public | Handle Google OAuth failure |

### Products

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Public | List products |
| `POST` | `/api/products` | Admin, Seller | Create a product |
| `GET` | `/api/products/seller/mine` | Seller | List seller-owned products |
| `GET` | `/api/products/:id` | Public | Get one product |
| `PATCH` | `/api/products/:id` | Admin, Seller | Update a product |
| `DELETE` | `/api/products/:id` | Admin, Seller | Remove a product |

### Categories

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/categories` | Public | List categories |
| `POST` | `/api/categories` | Admin | Create a category |
| `PATCH` | `/api/categories/:id` | Admin | Update a category |
| `DELETE` | `/api/categories/:id` | Admin | Remove a category |

### Cart and Orders

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/cart` | Authenticated | Read current cart |
| `POST` | `/api/cart` | Authenticated | Add an item to cart |
| `PATCH` | `/api/cart/:productId` | Authenticated | Update cart item quantity |
| `DELETE` | `/api/cart/:productId` | Authenticated | Remove an item from cart |
| `DELETE` | `/api/cart` | Authenticated | Empty the cart |
| `POST` | `/api/orders` | Authenticated | Create an order |
| `GET` | `/api/orders` | Authenticated | List current user's orders |
| `GET` | `/api/orders/:id` | Authenticated | Get one order |
| `PATCH` | `/api/orders/:id/status` | Admin | Update order status |

### Payments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/payments/checkout-session` | Authenticated | Create a Stripe Checkout session |
| `GET` | `/api/payments/checkout-session/:sessionId/success` | Authenticated | Confirm a successful checkout |

### Reviews, Uploads, Users, Dashboards

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/reviews/product/:productId` | Public | List reviews for a product |
| `POST` | `/api/reviews/product/:productId` | Authenticated | Add a product review |
| `POST` | `/api/upload/product-image` | Admin, Seller | Upload a product image |
| `PATCH` | `/api/users/profile` | Authenticated | Update profile details |
| `POST` | `/api/users/profile/password-otp` | Authenticated | Send password-change OTP |
| `PATCH` | `/api/users/profile/password` | Authenticated | Update password |
| `PATCH` | `/api/users/profile/avatar` | Authenticated | Upload profile avatar |
| `DELETE` | `/api/users/profile/avatar` | Authenticated | Delete profile avatar |
| `GET` | `/api/users` | Admin | List users |
| `PATCH` | `/api/users/:id/role` | Admin | Update user role |
| `GET` | `/api/dashboard/admin` | Admin | Admin metrics and recent activity |
| `GET` | `/api/dashboard/seller` | Seller | Seller metrics and recent activity |
| `GET` | `/api/dashboard/user` | User | User summary metrics |

## Authentication

Protected endpoints accept a JWT in either place:

```http
Authorization: Bearer <token>
```

or in the `token` cookie set by the auth service. Role checks are enforced by the `authorize(...)` middleware.

## Data Models

| Model | Purpose |
| --- | --- |
| `User` | Accounts, roles, local or Google provider data, profile details |
| `Product` | Catalog items, seller ownership, category, pricing, images, ratings |
| `Category` | Product grouping and catalog organization |
| `Cart` | Per-user cart items |
| `Order` | Checkout items, shipping address, totals, order status |
| `Payment` | Stripe payment state connected to orders |
| `Review` | Product ratings and comments |
| `Inventory` | Stock quantity, SKU, and low-stock threshold |

## Development Notes

- The API reads `FRONTEND_URL` for CORS and checkout redirects.
- In production, auth cookies are marked secure through `NODE_ENV=production`.
- Missing optional provider keys are handled at runtime for their related features.
- Passwords are hashed with bcrypt before user documents are saved.
- Product reviews are unique per `(user, product)` pair.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `MONGO_URI is missing` | Add `MONGO_URI` to `.env` |
| `jwt must be provided` or auth failures | Confirm `JWT_SECRET` is set and the request includes a valid token |
| Stripe checkout fails | Add `STRIPE_SECRET_KEY` and confirm the order belongs to the signed-in user |
| Image upload fails | Add all Cloudinary variables |
| Google OAuth does not start | Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a valid callback URL |
| Emails work locally but not on Render | Use Gmail API variables, `BREVO_API_KEY`, `RESEND_API_KEY`, or `EMAIL_WEBHOOK_URL`; many cloud/free hosts block SMTP ports like 465 and 587 |
| Emails are not sent locally | Add SMTP variables or use `EMAIL_PREVIEW=true` during development |

## License

This project is private and currently has no public license.

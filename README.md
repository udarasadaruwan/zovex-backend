# Zovex Backend

Zovex Backend is the REST API for a role-based MERN ecommerce platform. It powers authentication, Google OAuth, product management, carts, orders, Stripe Checkout, Cloudinary media uploads, reviews, dashboards, profile settings, and production email delivery.

## Project Snapshot

| Area | Details |
| --- | --- |
| Type | Ecommerce REST API |
| Runtime | Node.js, Express, ES modules |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcrypt, Google OAuth |
| Payments | Stripe Checkout |
| Media | Cloudinary |
| Email | Gmail API, Brevo, webhook, Resend, SMTP fallback |
| Deployment | Render |

## Live API

```text
https://zovex-backend.onrender.com/api
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

## What This Project Demonstrates

- Modular Express architecture with routes, controllers, services, models, middleware, and utilities.
- Role-based API access for customers, sellers, and administrators.
- Real ecommerce workflows: catalog, cart, order creation, payment confirmation, inventory, and reviews.
- Secure authentication using JWT, hashed passwords, cookies, and Google OAuth.
- Cloud media handling through Cloudinary.
- Production email strategy that avoids blocked SMTP ports on cloud hosts by using HTTPS email APIs.
- Dashboard analytics for operational visibility across admin, seller, and user roles.

## Key Features

### Authentication and Accounts

- Register, login, logout, and current-user endpoints
- JWT authentication with bearer token and cookie support
- Password reset OTP flow
- Password change OTP flow
- Google OAuth login through Passport
- Profile update, phone/address storage, avatar upload, and avatar removal

### Ecommerce

- Public product and category browsing
- Seller/admin product creation and updates
- Product image upload through Cloudinary
- Per-user cart endpoints
- Order creation with shipping address
- Seller fulfillment status updates for seller-owned product orders
- Stripe Checkout session creation
- Payment success confirmation
- Cart clearing only after confirmed payment
- Order confirmation emails

### Reviews and Dashboards

- Product review creation and listing
- One review per user per product
- Admin dashboard metrics for users, sellers, categories, products, orders, reviews, revenue, and ratings
- Seller dashboard metrics for seller-owned catalog, low stock, orders, reviews, and revenue
- Seller order management with ownership checks before fulfillment status changes
- User dashboard summary for orders and cart state

## Tech Stack

| Purpose | Technology |
| --- | --- |
| Server | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs, Passport Google OAuth |
| Payments | Stripe |
| Uploads | Multer, Cloudinary |
| Email | Gmail API, Brevo, Resend, Nodemailer |
| Middleware | CORS, Cookie Parser, Morgan |
| Development | Nodemon, dotenv |

## Project Structure

```text
src/
  app.js                  Express app, middleware, CORS, and API mounting
  server.js               MongoDB connection and HTTP server startup
  config/                 Database, Passport, Stripe, Cloudinary setup
  controllers/            Request handlers and HTTP response logic
  middleware/             Auth, upload, and error middleware
  models/                 Mongoose schemas
  routes/                 API route definitions
  services/               Business logic for auth, carts, orders, payments, emails, media
  utils/                  Shared async and API error helpers
```

## Environment Variables

Create `.env` in the backend root.

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

EMAIL_FROM=Zovex <your-sender-email@gmail.com>

# Recommended production email path for Render.
GMAIL_API_CLIENT_ID=your-google-oauth-client-id
GMAIL_API_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_API_REFRESH_TOKEN=your-google-oauth-refresh-token
GMAIL_API_USER=me

# Optional alternatives.
BREVO_API_KEY=xkeysib-your-brevo-api-key
BREVO_SENDER_NAME=Zovex
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_WEBHOOK_URL=https://your-email-webhook.example.com/send
EMAIL_WEBHOOK_SECRET=replace-with-a-shared-secret

# Local SMTP fallback. Some cloud hosts block SMTP ports in production.
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_PREVIEW=true
```

Only `MONGO_URI` and `JWT_SECRET` are required for the core API to boot. Stripe, Cloudinary, Google OAuth, and email features require their related variables.

For deployed Render email, prefer Gmail API or another HTTPS provider. Gmail SMTP can work locally but may fail on cloud infrastructure because SMTP ports are often blocked.

## Gmail API Email Setup

This project can send OTP, welcome, password-change, and order confirmation emails through Gmail API.

1. Enable **Gmail API** in Google Cloud Console.
2. Add the sender Gmail account as a test user while the OAuth app is in testing mode.
3. Add this redirect URI to the Google OAuth client:

```text
https://developers.google.com/oauthplayground
```

4. Open Google OAuth Playground.
5. Enable **Use your own OAuth credentials**.
6. Use this scope:

```text
https://www.googleapis.com/auth/gmail.send
```

7. Authorize with the sender Gmail account.
8. Exchange the authorization code for tokens.
9. Copy the refresh token into `GMAIL_API_REFRESH_TOKEN`.

Render production example:

```env
NODE_ENV=production
FRONTEND_URL=https://udarasadaruwan.github.io/zovex-frontend
GOOGLE_CALLBACK_URL=https://zovex-backend.onrender.com/api/auth/google/callback
GMAIL_API_USER=me
EMAIL_FROM=Zovex <your-sender-email@gmail.com>
```

Keep Gmail API credentials and refresh tokens only on the backend. Never expose them in the frontend.

## Installation

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

The API starts at:

```text
http://localhost:5000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Nodemon |
| `npm start` | Start the API with Node |

## API Overview

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

### Products and Categories

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Public | List products |
| `POST` | `/api/products` | Admin, Seller | Create a product |
| `GET` | `/api/products/seller/mine` | Seller | List seller-owned products |
| `GET` | `/api/products/:id` | Public | Get one product |
| `PATCH` | `/api/products/:id` | Admin, Seller | Update a product |
| `DELETE` | `/api/products/:id` | Admin, Seller | Remove a product |
| `GET` | `/api/categories` | Public | List categories |
| `POST` | `/api/categories` | Admin | Create a category |
| `PATCH` | `/api/categories/:id` | Admin | Update a category |
| `DELETE` | `/api/categories/:id` | Admin | Remove a category |

### Cart, Orders, and Payments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/cart` | Authenticated | Read current cart |
| `POST` | `/api/cart` | Authenticated | Add an item to cart |
| `PATCH` | `/api/cart/:productId` | Authenticated | Update cart quantity |
| `DELETE` | `/api/cart/:productId` | Authenticated | Remove an item |
| `DELETE` | `/api/cart` | Authenticated | Empty the cart |
| `POST` | `/api/orders` | Authenticated | Create an order |
| `GET` | `/api/orders` | Authenticated | List current user's orders |
| `GET` | `/api/orders/:id` | Authenticated | Get one order |
| `PATCH` | `/api/orders/:id/status` | Admin, Seller | Update order status |
| `POST` | `/api/payments/checkout-session` | Authenticated | Create Stripe Checkout session |
| `GET` | `/api/payments/checkout-session/:sessionId/success` | Authenticated | Confirm successful checkout |

### Reviews, Users, Uploads, and Dashboards

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/reviews/product/:productId` | Public | List product reviews |
| `POST` | `/api/reviews/product/:productId` | Authenticated | Add a product review |
| `POST` | `/api/upload/product-image` | Admin, Seller | Upload product image |
| `PATCH` | `/api/users/profile` | Authenticated | Update profile details |
| `POST` | `/api/users/profile/password-otp` | Authenticated | Send password-change OTP |
| `PATCH` | `/api/users/profile/password` | Authenticated | Update password |
| `PATCH` | `/api/users/profile/avatar` | Authenticated | Upload avatar |
| `DELETE` | `/api/users/profile/avatar` | Authenticated | Delete avatar |
| `GET` | `/api/users` | Admin | List users |
| `PATCH` | `/api/users/:id/role` | Admin | Update user role |
| `GET` | `/api/dashboard/admin` | Admin | Admin analytics and recent activity |
| `GET` | `/api/dashboard/seller` | Seller | Seller analytics and recent activity |
| `GET` | `/api/dashboard/user` | User | User summary metrics |

## Authentication Model

Protected routes accept a JWT in either format:

```http
Authorization: Bearer <token>
```

or through the `token` cookie set by the auth service.

Role checks are enforced by authorization middleware:

```text
user -> customer features
seller -> seller inventory and seller dashboard
admin -> user roles, categories, order status, platform dashboard
```

Sellers can move orders through fulfillment states (`paid`, `processing`, `shipped`, `delivered`) only when every product in that order belongs to them. Admins retain full order status control.

## Data Models

| Model | Purpose |
| --- | --- |
| `User` | Accounts, roles, OAuth/local provider data, profile details |
| `Product` | Catalog item, seller ownership, category, price, images, ratings |
| `Category` | Product grouping and slugs |
| `Cart` | Per-user cart state |
| `Order` | Checkout items, shipping address, totals, status |
| `Payment` | Stripe session/payment state linked to an order |
| `Review` | Product rating and comment |
| `Inventory` | Quantity, SKU, low-stock threshold |

## Production Notes

- `FRONTEND_URL` controls CORS and Stripe redirect URLs.
- `NODE_ENV=production` enables production-safe cookie behavior.
- Email sending is provider-prioritized: Gmail API, Brevo, webhook, Resend, then SMTP.
- Order confirmation email failures do not block successful payment confirmation.
- Password reset OTP emails intentionally fail the request if delivery fails.
- Cloudinary keys are required for product and avatar uploads.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `MONGO_URI is missing` | Add `MONGO_URI` to backend environment variables |
| Auth fails with JWT errors | Confirm `JWT_SECRET` is set and frontend sends the token |
| Google OAuth redirect mismatch | Check `GOOGLE_CALLBACK_URL` and Google Cloud authorized redirect URIs |
| Stripe checkout fails | Add `STRIPE_SECRET_KEY` and confirm the order belongs to the signed-in user |
| Images do not upload | Add all Cloudinary variables |
| Emails work locally but not on Render | Use Gmail API variables or another HTTPS email provider |
| Gmail API authorization fails | Add sender Gmail as a Google OAuth test user and use `gmail.send` scope |

## Interview Talking Points

- Why the API is split into controller and service layers.
- How role-based access control protects seller and admin routes.
- How seller fulfillment updates are allowed without exposing another seller's orders.
- How Stripe payment confirmation is separated from order creation.
- How email delivery was adapted for Render by moving from SMTP to HTTPS providers.
- How dashboard endpoints aggregate operational data for each role.
- How secure environment variable boundaries are maintained between frontend and backend.

## Related Repository

Frontend app: `zovex-frontend`

## License

This project is private and currently has no public license.

# NestJS Wallet Service

A production-quality Wallet Service built with NestJS, TypeORM, and PostgreSQL.

## Features

- **Google Sign-In (JWT)**
- **API Key System**: Secure service-to-service access with permissions, expiry, and revocation.
- **Wallet Operations**: Deposit via Paystack, Wallet-to-Wallet transfers.
- **Database**: PostgreSQL with atomic transactions (`FOR UPDATE`) to ensure consistency.
- **Strict TypeScript**: No `any` types allowed.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Copy `.env.example` to `.env` (if provided) or set the following:
    ```env
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=postgres
    DB_DATABASE=wallet_service
    NODE_ENV=development
    PAYSTACK_SECRET_KEY=sk_test_...
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    JWT_SECRET=your_jwt_secret
    ```

3.  **Database Migration**
    Ensure PostgreSQL is running and the database exists.
    ```bash
    npm run migration:generate --name=Initial
    npm run migration:run
    ```

## Running the App

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Documentation

Swagger documentation is available at `/api/docs` when the server is running.

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e
```

## Project Structure

- `src/users`: User management and profile.
- `src/wallets`: Wallet logic, balance, and transfers.
- `src/transactions`: Transaction history and recording.
- `src/api-keys`: API key management.
- `src/common`: Shared DTOs and utilities.

## Webhooks & Testing

### Testing Paystack Webhooks (Swagger)
The `POST /wallet/paystack/webhook` endpoint validates the request signature (`x-paystack-signature`) against the raw request body using your `PAYSTACK_SECRET_KEY`.

**To test manually in Swagger:**
1.  **Generate a signature** independently (do not use online tools with real secrets).
    Run this quick Node.js command in your terminal:
    ```bash
    node -e "console.log(require('crypto').createHmac('sha512', 'sk_test_YOUR_KEY').update(JSON.stringify({event:'charge.success',data:{...}})).digest('hex'))"
    ```
2.  Set the `x-paystack-signature` header in Swagger.
3.  Send the matching JSON body: `{"event":"charge.success","data":{...}}`.

### Real Paystack Testing
For real integration testing:
1.  Use a dev tunnel (e.g. VS Code, Ngrok) to expose localhost.
2.  Set your Paystack Dashboard Webhook URL to: `https://<your-tunnel-url>/wallet/paystack/webhook`.
3.  Initiate a deposit via Swagger -> Click returned link -> Pay with test card.


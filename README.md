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

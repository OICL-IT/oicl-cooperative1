# OICL Cooperative Society Management System

A comprehensive MERN stack application designed for the staff of ODU'A Investment Company Limited (OICL) to manage their cooperative activities, including savings, loans, and administrative oversight.

## 🏗️ Project Structure

```text
OICL-COOPERATIVE/
├── frontend/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Individual page components
│   │   ├── layouts/           # Page layout wrappers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API communication services
│   │   ├── utils/             # Utility functions
│   │   ├── lib/               # Third-party library configs
│   │   └── types/             # TypeScript type definitions
│   ├── index.html             # FE Entry point
│   ├── vite.config.ts         # Vite configuration
│   └── package.json           # FE Dependencies
├── backend/                   # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/       # Route logic handlers
│   │   ├── routes/            # API Route definitions
│   │   ├── models/            # Mongoose data models
│   │   ├── middleware/        # Express middleware (Auth, etc.)
│   │   ├── database/          # Database connection logic
│   │   ├── app.ts             # Express App setup
│   │   └── server.ts          # Server entry point
│   └── package.json           # BE Dependencies
└── package.json               # Root orchestrator
```

## 🚀 Key Features

- **Membership Onboarding**: Secure registration and profile management.
- **Thrift Savings**: Automated deduction tracking and historical statements.
- **Credit Operations**: 
  - Multi-product loan application system.
  - Automated eligibility verification (savings-based).
  - Repayment forecast and amortization schedules.
- **Guarantor System**: Peer-to-peer loan guarantee requests and approvals.
- **Executive Control**:
  - Administrative dashboard for society oversight.
  - One-click payroll deduction processing.
  - Loan category and product management.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.js, JWT Authentication.
- **Database**: MongoDB (MQL) via Mongoose.
- **Dev Tools**: TypeScript, TSX, ESLint.

## 🚦 Getting Started

1. **Install Dependencies**: `npm install` at root.
2. **Setup Environment**: Configure `.env` with `MONGODB_URI` and `JWT_SECRET`.
3. **Run Application** from the project root:

   - Recommended: `npm run dev` starts the API and frontend together at `http://localhost:3000`.
   - Split-terminal mode:
     1. Run `npm run dev:api` in the first terminal.
     2. Run `npm run dev:frontend` in the second terminal.
     3. Open `http://localhost:5173`.

If Vite reports `http proxy error` or `ECONNREFUSED` for an `/api/...` URL, the frontend is running without the API server. Start `npm run dev:api` from the project root.

---
© 2026 ODU'A Investment Company Limited. All Rights Reserved.

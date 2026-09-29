# OICL Staff Cooperative Society Management System - System Design

## 1. Software Architecture
A Full-Stack Micro-Monolith architecture designed for scalability, security, and financial integrity.

- **Client Layer**: React.js Single Page Application (SPA) with responsive Tailwind CSS.
- **API Layer**: Node.js/Express.js RESTful API handling business logic, approval workflows, and financial calculations.
- **Data Persistence Layer**: Google Firebase (Firestore + Authentication).
- **Service Layer**: Integration with payroll systems (simulated) and notification engines.

## 2. Database Schema Design (Firestore Blueprint)

### Entities
- **Members**: `uid, staffId, fullName, email, department, status (active/retired), dateJoined, shareCapitalBalance, welfareBalance, totalSavings`
- **SavingsEntries**: `id, memberId, amount, type (thrift/welfare/shares), period, timestamp, postedBy`
- **LoanCategories**: `id, name, maxAmount, interestRate, maxDuration, requirements`
- **Loans**: `id, memberId, categoryId, principal, interestTotal, balanceRemaining, status (pending/guarantor_review/admin_review/approved/disbursed/closed), repaymentSource`
- **Guarantors**: `id, loanId, memberId, status (pending/accepted/rejected), remarks`
- **Approvals**: `id, resourceType (loan/membership), resourceId, step, status, actorId, remarks, timestamp`
- **LedgerEntries**: `id, accountCode, debit, credit, description, refId (loanId/savingsId), timestamp`

## 3. API Structure

### Auth
- `POST /api/auth/register`: Membership onboarding request.
- `POST /api/auth/login`: Identity verification.

### Member Portal
- `GET /api/member/profile`: Personal dashboard data.
- `GET /api/member/savings`: Historical savings statement.
- `POST /api/member/loans/apply`: Loan application submission.

### Admin/Executive
- `GET /api/admin/members`: Member registry management.
- `GET /api/admin/approvals`: Pending approval queue.
- `POST /api/admin/approvals/:id`: Decision submission.

## 4. Authentication & Security
- **Identity**: Firebase Authentication (ID Tokens).
- **Authorization**: Custom Claims (Role-Based Access Control).
- **Security Rules**: Granular Firestore Security Rules ensuring members only see their data, while executives see relevant queues.

## 5. Approval Workflow Design (Linear Chain)
1. **Initiation**: Member submits (e.g., Loan).
2. **Guarantor Loop**: If required, guarantors must accept.
3. **Internal Review**: Cooperative Officer / Auditor checks eligibility.
4. **Financial Sanction**: Treasurer / Financial Secretary verifies funds.
5. **Final Executive**: President signs off.

## 6. Financial Transaction Safety Strategy
- **Atomic Operations**: Using Firestore Transactions for all balance updates.
- **Double-Entry Consistency**: Every transaction must have a corresponding LedgerEntry.
- **Audit Logging**: Every action (create, update, approve) is recorded in a write-only AuditLogs collection.

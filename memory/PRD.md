# Club Bucks System - PRD

## Original Problem Statement
Build an app for a club bucks system, which is a type of currency used within an afterschool program club.

## User Choices/Inputs
- **User Roles**: Admin/Staff + Students + Parents (3 tiers)
- **Data Import**: Import existing 190+ members from Excel file
- **QR Code**: Both generation + scanning functionality
- **Features**: All features crucial (member management, transactions, balance tracking, QR codes, dashboard, leaderboard)
- **Authentication**: Both JWT + Google OAuth, admin-only permissions for modifications

## User Personas
1. **Admin/Staff**: Manage members, log transactions, view analytics, scan QR codes at stations
2. **Students**: View own balance, show QR code to earn/spend bucks, view transaction history
3. **Parents**: View child's balance and activity via linked accounts

## Core Requirements
- Member management (CRUD operations)
- Transaction logging (earn, spend, bonus, adjustment)
- Real-time balance tracking
- QR code generation per member
- QR code scanning at stations
- Dashboard with analytics
- Leaderboard for top earners
- Role-based access control
- Google OAuth for easy login
- Parent-child account linking
- Bulk CSV import

## Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - Main API server
- JWT authentication with httpOnly cookies
- Google OAuth via Emergent Auth
- MongoDB for data storage
- QR code generation using qrcode library
- CSV file upload support

### Frontend (React)
- `/app/frontend/src/App.js` - Main routing with OAuth callback handling
- `/app/frontend/src/context/AuthContext.js` - Auth state with Google OAuth
- `/app/frontend/src/services/api.js` - API client
- Pages: Login, Register, AuthCallback, AdminDashboard, Members, AddMember, EditMember, BulkImport, Transactions, Leaderboard, Scanner, StudentDashboard, ParentDashboard

### Database Collections
- `users` - User accounts with roles and linked_children
- `user_sessions` - Google OAuth sessions
- `members` - Club members with balances
- `transactions` - Transaction history
- `login_attempts` - Brute force protection

## What's Been Implemented

### Phase 1 (Complete - Jan 2026)
- [x] JWT Authentication with httpOnly cookies
- [x] Admin seeding on startup
- [x] Member management (CRUD)
- [x] Transaction logging (earn, spend, bonus, adjustment)
- [x] QR code generation
- [x] QR code scanning with html5-qrcode
- [x] Dashboard with stats
- [x] Leaderboard with podium view
- [x] Scan Station for quick transactions
- [x] Role-based routing

### Phase 2 (Complete - Jan 2026)
- [x] Google OAuth integration via Emergent Auth
- [x] Parent dashboard with child linking
- [x] Bulk CSV import for members
- [x] Edit member page with balance display
- [x] Import CSV button on Members page

### Phase 3 (Complete - Apr 2026)
- [x] Staff management page (admin vs staff roles)
- [x] Admin Settings page (app name, colors, theme)
- [x] Export to CSV for Members and Transactions
- [x] Scan Station manual entry with searchable dropdown
- [x] Full Excel data import: 258 members from uploaded Excel file (clubbucks_pay_app_final_fixed)
- [x] Existing member balances preserved during import (upsert logic)

## Prioritized Backlog

### P0 - Completed
- All core features implemented
- Google OAuth working
- Parent dashboard with child linking
- CSV bulk import
- Member editing
- Staff management & admin settings
- CSV/Excel export
- Full Excel data import (258 members)

### P1 - Next Up
- Store/reward shop system
- Achievement badges

### P2 - Nice to Have
- Transaction export pagination (performance)
- Email notifications for parents
- Multiple clubs support
- Staff shift tracking
- Points decay/expiration
- Mobile app (React Native)

## Test Credentials
- Admin Email: admin@clubbucks.com
- Admin Password: ClubBucks2024!
- Google OAuth: Any Google account (default role: student)

## API Endpoints

### Auth
- POST /api/auth/login - Email/password login
- POST /api/auth/google/session - Google OAuth session exchange
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh

### Members
- GET /api/members
- POST /api/members
- GET /api/members/{id}
- PUT /api/members/{id}
- DELETE /api/members/{id}
- POST /api/members/bulk-import
- POST /api/members/upload-csv

### Transactions
- GET /api/transactions
- POST /api/transactions
- POST /api/transactions/quick

### Dashboard
- GET /api/dashboard/stats
- GET /api/dashboard/leaderboard
- GET /api/dashboard/recent-transactions

### QR Codes
- GET /api/qr/{member_id}
- POST /api/qr/scan

### Parent
- POST /api/parent/link-child
- DELETE /api/parent/unlink-child/{member_id}
- GET /api/parent/children
- GET /api/parent/child/{member_id}/transactions

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
3. **Parents**: View child's balance and activity (coming soon)

## Core Requirements
- Member management (CRUD operations)
- Transaction logging (earn, spend, bonus, adjustment)
- Real-time balance tracking
- QR code generation per member
- QR code scanning at stations
- Dashboard with analytics
- Leaderboard for top earners
- Role-based access control

## Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - Main API server
- JWT authentication with httpOnly cookies
- MongoDB for data storage
- QR code generation using qrcode library

### Frontend (React)
- `/app/frontend/src/App.js` - Main routing
- `/app/frontend/src/context/AuthContext.js` - Auth state
- `/app/frontend/src/services/api.js` - API client
- Pages: Login, Register, AdminDashboard, Members, Transactions, Leaderboard, Scanner, StudentDashboard

### Database Collections
- `users` - User accounts with roles
- `members` - Club members with balances
- `transactions` - Transaction history
- `login_attempts` - Brute force protection

## What's Been Implemented (Jan 2026)
- [x] JWT Authentication with httpOnly cookies
- [x] Admin seeding on startup
- [x] Member management (CRUD)
- [x] Transaction logging (earn, spend, bonus, adjustment)
- [x] QR code generation
- [x] QR code scanning with html5-qrcode
- [x] Dashboard with stats
- [x] Leaderboard with podium view
- [x] Scan Station for quick transactions
- [x] 50 members imported from Excel data
- [x] Role-based routing

## Prioritized Backlog

### P0 - Completed
- All core features implemented

### P1 - Next Phase
- Google OAuth integration
- Parent dashboard with child linking
- Bulk member import via file upload
- Member edit page

### P2 - Future Enhancements
- Transaction reports/exports
- Store/reward shop system
- Achievement badges
- Email notifications

## Test Credentials
- Admin Email: admin@clubbucks.com
- Admin Password: ClubBucks2024!

## API Endpoints
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/members
- POST /api/members
- GET /api/members/{id}
- PUT /api/members/{id}
- DELETE /api/members/{id}
- GET /api/transactions
- POST /api/transactions
- POST /api/transactions/quick
- GET /api/dashboard/stats
- GET /api/dashboard/leaderboard
- GET /api/qr/{member_id}
- POST /api/qr/scan

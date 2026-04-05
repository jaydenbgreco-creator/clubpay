# Club Bucks System - PRD

## Original Problem Statement
Build an app for a "Club Bucks" system — a digital currency used within an afterschool program (Boys & Girls Clubs of Santa Monica). The system needs roles (Admin, Staff, Student, Parent), dashboards, member management, transaction logging, QR scanning, bulk import, export, and Google OAuth.

## User Personas
- **Admin (Super Admin)**: Runs the program. Full access to all clubs, members, settings.
- **Staff**: Manages day-to-day transactions within assigned clubs.
- **Student**: Views their balance, transaction history.
- **Parent**: Views their linked children's balances and activity.

## Core Architecture
- **Frontend**: React, Tailwind CSS, Shadcn UI, Libre Franklin (brand font)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Auth**: JWT (httpOnly cookies) + Google OAuth (Emergent Integrations)

## Brand Identity
- **Organization**: Boys & Girls Clubs of Santa Monica (SMBGC)
- **App Name**: ClubPay - Digital Bucks
- **Primary Color**: BGCA Blue #0080c6
- **Accent Color**: Green #84bd00
- **Extended Palette**: Navy #004b87, Purple #61279e, Pink #ed40a9, Faded Blue #bfdff1, Lightest Blue #e1eef9
- **Font**: Libre Franklin (headings), DM Sans (body)
- **Logo**: Extracted from brand kit PDF, stored in /public/brand/

## Data Model
- `users`: {email, password_hash, name, role, is_super_admin, clubs[], member_id, linked_children}
- `clubs`: {id, name, description, created_by, created_at}
- `members`: {id, member_id, first_name, last_name, display_name, club_id, club_name, status, starting_balance, earned, bonus, spent, adjustments, current_balance, qr_payload, notes, created_at}
- `transactions`: {id, member_id, member_name, type, category, amount, club_id, notes, staff_initials, created_at}
- `app_settings`: {_id: "app_settings", app_name, primary_color, accent_color, theme}

## Key API Endpoints
- Auth: POST /api/auth/login, /api/auth/register, /api/auth/google/session, GET /api/auth/me
- Clubs: GET /api/clubs, POST /api/clubs, PUT /api/clubs/{id}, DELETE /api/clubs/{id}
- Members: GET /api/members?club_id=, POST /api/members, PUT /api/members/{id}, DELETE /api/members/{id}
- Transactions: GET /api/transactions?club_id=, POST /api/transactions, POST /api/transactions/quick
- Dashboard: GET /api/dashboard/stats?club_id=, /api/dashboard/leaderboard?club_id=, /api/dashboard/recent-transactions?club_id=
- Export: GET /api/members/export?club_id=, GET /api/transactions/export?club_id=
- Settings: GET /api/settings, GET /api/settings/public, PUT /api/settings

## What's Been Implemented

### Phase 1 (Complete - Jan 2026)
- [x] JWT Authentication with httpOnly cookies
- [x] Admin seeding on startup
- [x] Member management (CRUD)
- [x] Transaction logging (earn, spend, bonus, adjustment)
- [x] QR code generation and scanning
- [x] Dashboard with stats, leaderboard, recent activity
- [x] Scan Station for quick transactions
- [x] Role-based routing

### Phase 2 (Complete - Jan 2026)
- [x] Google OAuth integration via Emergent Auth
- [x] Parent dashboard with child linking
- [x] Bulk CSV import for members
- [x] Edit member page with balance display

### Phase 3 (Complete - Apr 2026)
- [x] Staff management page (admin vs staff roles)
- [x] Admin Settings page (app name, colors, theme)
- [x] Export to CSV for Members and Transactions
- [x] Scan Station manual entry with searchable dropdown
- [x] Full Excel data import: 258 members

### Phase 4 (Complete - Apr 2026)
- [x] Multiple clubs support (JAMS Club as default)
- [x] Club CRUD (create, edit, delete with member protection)
- [x] Club selector dropdown in sidebar
- [x] All data views filtered by active club
- [x] Super admin access to all clubs
- [x] Shared AdminLayout component

### Phase 5 (Complete - Apr 2026)
- [x] BGCA brand kit integration (colors, logos, fonts)
- [x] Logo extraction from brand kit PDF (PyMuPDF)
- [x] Login page with brand identity
- [x] Brand color presets in Settings page (4 brand + 4 other)
- [x] Libre Franklin font for headings
- [x] All pages using AdminLayout with brand logo
- [x] CSS variables for brand colors

## Prioritized Backlog

### P1 - Next Up
- Store/reward shop system (students browse and redeem rewards)
- Achievement badges for milestones

### P2 - Nice to Have
- Transaction export pagination (performance at scale)
- Email notifications for parents
- Staff shift tracking
- Points decay/expiration
- Per-club settings (colors, theme)

### P3 - Future
- Mobile app (React Native)
- Multiple currency types per club
- Inter-club transfers

Core Concept: Business Workspace Shell

When a business becomes active:

You enter:

Business Layout (Tenant-Scoped Container)

Everything inside this layout:

Requires active business

Passes through tenant middleware

Re-checks membership

This layout contains:

Sidebar

Top bar (optional)

Main content area (router outlet)

This is not a profile page.
It’s a tenant-bound workspace container.

That distinction matters.

📐 Recommended Structure
🔷 Level 1 — Global App

Auth routes

User profile (no business required)

Business creation page

Once business is active → redirect into:

🔷 Level 2 — Business Workspace Layout

Sidebar:

1️⃣ Overview
2️⃣ Sales
3️⃣ Analytics
4️⃣ Members & Permissions
5️⃣ Settings
6️⃣ Social Portal
(7️⃣ Switch Business — but not as page, see below)

Main content:

Routed pages load here

🧠 Let’s Structure Each Section Properly
1️⃣ Overview (Dashboard)

Purpose:
Quick snapshot.

Content:

Business name

KPIs (sales count, revenue, etc.)

Shortcuts

Recent activity

It should not contain heavy analytics.

It is a summary layer.

Think “control center,” not “data lab.”

2️⃣ Sales

Pure transactional layer.

Contains:

Create sale

Sales list

Filters

Invoice access

No graphs here except maybe tiny summary cards.

This is operational mode.

3️⃣ Analytics

Pure analytical mode.

Inside:

Sales analytics tab

Social analytics tab

No editing.
No transactions.
Read-only intelligence.

Keep it clean.

4️⃣ Members & Permissions

Security domain.

Invite

Role assignment

Permission view

Remove

Important: This page must always revalidate membership on request.

This is sensitive.

5️⃣ Settings

Only:

Edit business info

Branding (colors)

Delete business

Future: billing

No operational logic here.

Settings should never mix with analytics or sales.

6️⃣ Social Portal

This is where I want you to be careful.

This is not analytics.
This is integration control.

It should handle:

Connect accounts

API tokens

Sync settings

Sync status

Data fetched from social APIs should be stored and then shown in Analytics page.

Do NOT show analytics here.

Keep integration separate from data presentation.

Middleware Flow Now

Business Workspace Layout should:

On load:

Verify authenticated

Verify active business exists

Re-check membership

Attach business context

If no active business:
→ Redirect to business selection page.

This keeps your level-three security intact.

📦 Folder / Mental Separation

Frontend:

App
├── User domain
└── Business domain
├── Layout
├── Overview
├── Sales
├── Analytics
├── Members
├── Settings
├── Social

Backend:

business/

sales/

analytics/

social/

membership/

Keep engines isolated.

Never mix them in one giant “business logic” module.
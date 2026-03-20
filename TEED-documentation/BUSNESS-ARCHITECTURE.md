🧠 TEED Multi-Tenant SaaS Architecture Blueprint

(3-Level Security Model + Middleware Tenant Resolution)

0️⃣ Foundational Assumptions

Authentication is complete and stable (JWT + Google OAuth).

Identity layer is secure and independent.

Users can exist without businesses.

Users can own or belong to multiple businesses.

Each business is a strict tenant boundary.

The system must prevent cross-tenant data access structurally.

1️⃣ Security Layering (Non-Negotiable Separation)

The system must enforce three distinct security levels:

🔓 Level 1 — Public

No authentication required.

Examples:

Login

Register

Verify

Recover password

Zero tenant awareness.

🔐 Level 2 — Authenticated (User-Level Protection)

User identity is verified.

No business context required.

Accessible routes:

Create business

List my businesses

Switch business

View/edit profile

Logout

At this layer:

request.user exists

request.business = None

No tenant enforcement yet

This layer must remain independent of business logic.

🏢 Level 3 — Authenticated + Business Context (Tenant-Protected)

User must:

Be authenticated

Have an active business

Be a member of that business

Accessible routes:

Products

Analytics

Payments

Staff

Invoices

Any tenant-scoped model

At this layer:

request.user

request.business

request.membership

All must exist and be validated.

2️⃣ Tenant Resolution Strategy (Middleware-Based)

Middleware responsibility:

Single purpose:

Resolve and validate active tenant context for authenticated users.

It must:

Run only if user is authenticated.

Read active_business_id from session.

If exists:

Validate business exists.

Validate business is active.

Validate membership exists for user.

Attach to request:

request.business

request.membership

If invalid:

Clear session active_business

Set request.business = None

Middleware does NOT:

Block routes

Enforce permissions

Handle switching

Filter querysets

It only resolves context.

This prevents coupling.

3️⃣ Business Switching Logic

Switching must be explicit.

Flow:

User sends business_id.

System validates membership.

Session active_business_id updated.

Middleware handles subsequent requests.

No token regeneration required for MVP.
No business stored inside JWT.
Session remains tenant context holder.

This keeps auth independent from tenancy.

4️⃣ Tenant Enforcement Model

Views determine whether business is required.

Two clear enforcement types:

UserProtected

Requires authentication only.

BusinessProtected

Requires:

Authentication

request.business

request.membership

BusinessProtected must reject request if business context missing.

Middleware resolves.
Views enforce.

Separation of concerns.

5️⃣ Query Safety Principle (Critical)

Authorization validation is not enough.

Tenant data isolation must exist at the query layer.

Every tenant-scoped model must:

Have mandatory ForeignKey(Business)

Never allow global queries without scoping

Minimum acceptable rule:

All business-level views must scope querysets using request.business.

Future-proof upgrade path:

Centralized queryset filtering

Custom managers

Base model abstraction

Eventually DB-level row isolation if scaling

Human discipline is acceptable for MVP.
System-enforced isolation is required for scale.

6️⃣ Membership & Role Model

Membership must:

Link User ↔ Business

Define role (Owner, Admin, Staff, etc.)

Be validated per request via middleware

request.membership.role becomes the permission anchor.

Permissions must be role-driven, not scattered logic.

7️⃣ Business Lifecycle Integrity

System must handle:

Membership removal

Role changes

Business deactivation

User removed from tenant

Because middleware re-validates per request,
stale authorization is prevented.

This is professional SaaS behavior.

8️⃣ Data Isolation Guarantee

The system must guarantee:

No user can access data of a business they do not belong to.

No accidental global queries.

No frontend-controlled tenant trust.

No reliance on token claims for tenant scoping.

Tenant isolation must always be enforced server-side.

9️⃣ Scalability Roadmap (Not Now, But Planned)

MVP:

Session-based tenant context

Middleware resolution

Manual scoped filtering

Future:

Header-based tenant resolution

Stateless tenant context

Query manager enforcement

Performance optimization

Possibly subdomain-based tenancy

Do not prematurely optimize.

🔟 Mental Model You Must Keep

Identity ≠ Tenant
Authentication ≠ Authorization
Middleware resolves context
Views enforce requirement
Queries enforce isolation
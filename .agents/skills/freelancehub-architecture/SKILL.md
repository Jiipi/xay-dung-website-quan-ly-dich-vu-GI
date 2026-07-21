---
name: freelancehub-architecture
description: Guidelines for enforcing the 3-tier architecture layout of FreelanceHub.
---

# FreelanceHub Architecture Skill

This skill enforces the 3-tier architecture of FreelanceHub during code generation and file structure creation.

## 3-Tier Layer Definitions

### 1. Presentation Layer (`src/app/` & `src/components/`)
- Contains only UI components, Page routing, Server Actions that handle form state directly, and layout templates.
- **Rules:** No direct Prisma queries or raw SQL here. All interactions must delegate to the Application/Domain layer modules.
- **Routing structure:**
  - `(marketing)`: Public pages (Landing, pricing).
  - `(auth)`: Auth screens.
  - `(dashboard)`: Admin backoffice for freelancers.
  - `(portal)`: Access restricted client portal.
  - `(public)`: Token-based shareable links (`/q/[token]`, `/c/[token]`, `/i/[token]`).

### 2. Application / Domain Layer (`src/modules/`)
- Contains core business logic organized by module (e.g., `clients`, `quotes`, `contracts`, `invoices`, `projects`, `reminders`).
- **Rules:** Business logic must not contain HTTP router details or specific database adapters. It should express domain concepts. E.g., `calculateInvoiceTotals(items, discount, tax)` or `signContract(contractId, signerInfo)`.
- Use service-based structures or action-based modules.

### 3. Data / Infrastructure Layer (`src/infrastructure/` & `src/lib/db/`)
- Contains integrations with third-party APIs, database adapters, queue management, storage providers, and PDF rendering.
- **Rules:** Code here is dedicated to interfacing with external resources (Prisma database client, S3 client, SMTP client, Payment APIs, Puppeteer PDF renderer).
- Modules should interact with these through abstraction adapters (e.g., `src/infrastructure/payments/adapter.ts`).

## Code Placement Checklist
- If writing a database query, it goes into `src/modules/[module]/services/` or `src/infrastructure/database/`.
- If writing a form submission handler, it goes in a Server Action under `src/app/` or `src/modules/[module]/actions.ts`.
- If styling a page or component, it goes under `src/app/` or `src/components/`.

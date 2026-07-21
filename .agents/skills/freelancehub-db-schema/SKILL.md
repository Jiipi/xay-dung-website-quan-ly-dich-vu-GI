---
name: freelancehub-db-schema
description: Guidelines for Prisma schema design and multi-tenant database operations.
---

# FreelanceHub Database Schema Skill

This skill guides the creation and querying of the FreelanceHub database schemas, ensuring tenant isolation and clean relations.

## Multi-Tenant Security Rules
1. **Always Filter by `workspaceId` or `clientId`:**
   - Every read, update, or delete database operation must include a tenant identifier (e.g., `workspaceId` for backoffice operations, or `clientId` for client portal operations).
   - Example:
     ```typescript
     // Correct
     const clients = await prisma.client.findMany({
       where: { workspaceId }
     });
     
     // Incorrect - missing tenant boundaries!
     const clients = await prisma.client.findMany();
     ```
2. **Soft Deletes for CRMs:**
   - Essential tables (like `Client`) should use soft deletes. Query them by checking `deletedAt: null`.
3. **Sequence Numbering:**
   - Quotes and Invoices must have workspace-specific sequence numbers (e.g., `INV-2026-0001`). Create a helper utility to calculate the next sequence number within the same workspace to prevent collisions.

## Key Relations
- A `Workspace` contains multiple `User`s via `WorkspaceMember` (n-n relation).
- A `Client` belongs to a single `Workspace`, but has multiple `Contact`s, `Quote`s, `Contract`s, `Invoice`s, and `Project`s.
- `Quote` can be converted to a `Contract` and/or `Invoice`. Ensure foreign keys (`quoteId` and `contractId`) are tracked on the resulting entities.

# SECURITY ARCHITECTURE

## 1. Authentication & Multi-Tenant Isolation
- Session tokens validated via NextAuth / custom JWT middleware on every API route (`getServerSession` / `verifyAuth`).
- All Prisma database queries enforce `where: { userId: user.id }`. Under no circumstances can a user read, modify, or delete another user's assignments, notes, mistakes, or cognitive memory.

## 2. Input Validation & File Security
- Document and syllabus parsing sanitize input text to prevent prompt injection or script execution.
- File upload handlers validate MIME types and reject executable extensions.
- Database operations reject malformed IDs and handle foreign key constraint violations gracefully without exposing raw database tracebacks.

## 3. API Key & Provider Safety
- AI keys (Google Gemini, OpenAI, Claude) reside strictly in server-side environment variables (`.env`).
- Never exposed in client-side bundles or headers.
- User-supplied API keys (if configured via `/settings/api-keys`) are encrypted at rest.

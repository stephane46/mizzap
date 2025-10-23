# MIZZAP - Windsurf Setup & Collaboration Guide

**Version**: 1.0  
**Last Updated**: October 23, 2025  
**Author**: Stéphane Eloit + Claude AI  

---

## Table of Contents

1. [Windsurf Overview](#windsurf-overview)
2. [Project Setup](#project-setup)
3. [GitHub Integration](#github-integration)
4. [Claude AI Integration](#claude-ai-integration)
5. [Workflow & Collaboration](#workflow--collaboration)
6. [Master System Prompt](#master-system-prompt)
7. [Daily Standup Template](#daily-standup-template)
8. [Code Review Process](#code-review-process)
9. [Troubleshooting](#troubleshooting)

---

## Windsurf Overview

**Windsurf** is a code editor that integrates Claude AI for real-time code assistance. Unlike Claude Desktop (which is chat-based), Windsurf:

- ✅ Edits files directly in your IDE
- ✅ Sees your entire project structure
- ✅ Suggests code improvements in context
- ✅ Runs tests + builds integrated with your editor
- ✅ Git integration (commit, branch, push)
- ✅ Real-time collaboration on code

**Key Advantage**: You write code, Claude reviews and suggests improvements in real-time.

---

## Project Setup

### Step 1: Initialize Git Repository

```bash
# Navigate to project folder
cd "C:\Users\ngocn\OneDrive\1 Personal\1 NOUS\MEMOPYK EURL\Systems"

# Create new directory for MIZZAP
mkdir mizzap
cd mizzap

# Initialize git
git init
git config user.email "stephane.eloit@outlook.com"
git config user.name "Stephane Eloit"

# Create initial structure
mkdir -p backend frontend docs

# Create README
cat > README.md << 'EOF'
# MIZZAP - Privacy-First Photo & Video Organization Platform

A mobile-first app that helps families organize, deduplicate, and curate their photo and video memories—without cloud lock-in or privacy concerns.

## Architecture

See `/architecture` folder for:
- `00-EXECUTIVE-SUMMARY.md` - Business overview
- `01-TECHNICAL-ARCHITECTURE.md` - System design
- `02-IMPLEMENTATION-ROADMAP.md` - 6-month plan
- `03-WINDSURF-SETUP-GUIDE.md` - This file

## Getting Started

See `backend/README.md` and `frontend/README.md`

## Repository

GitHub: https://github.com/stephane46/mizzap
EOF

git add .
git commit -m "Initial project structure"
```

### Step 2: Add GitHub Remote

```bash
git remote add origin https://github.com/stephane46/mizzap.git
git push -u origin main
```

### Step 3: Open in Windsurf

1. **Launch Windsurf**
2. **File → Open Folder**
3. **Select**: `C:\Users\ngocn\OneDrive\1 Personal\1 NOUS\MEMOPYK EURL\Systems\mizzap`
4. **Windsurf will detect**:
   - Git repository
   - Node.js project structure
   - Available commands

---

## GitHub Integration

### Branch Strategy

```
main (production-ready)
  ├─ develop (integration branch)
  │   ├─ feature/auth
  │   ├─ feature/photos-service
  │   ├─ feature/dedup-engine
  │   └─ ...
  └─ hotfix/bug-fixes
```

### Creating Feature Branches

**In Windsurf**:
1. Click **Source Control** (left sidebar)
2. Click **Branch** icon
3. Create branch: `feature/auth-service`
4. Windsurf checks out automatically

**Or via terminal**:
```bash
git checkout -b feature/auth-service
```

### Committing Code

**Via Windsurf**:
1. Edit files (Claude suggests improvements)
2. **Source Control** → See changes
3. **Stage** files (+ icon)
4. **Message** box: Write commit message
5. **Commit** button
6. **Sync** to push

**Good Commit Messages**:
```
feat: add JWT authentication service

- Implement password hashing (bcrypt)
- JWT token generation + refresh
- User registration endpoint
- Comprehensive test coverage (92%)
```

---

## Claude AI Integration

### Accessing Claude in Windsurf

1. **Press Ctrl+Shift+L** (or ⌘+Shift+L on Mac)
2. Claude chat panel opens on right side
3. Ask questions about your code

### Example Queries

```
"Explain the deduplication flow in backend/src/services/dedup.ts"

"Write a unit test for the MD5 hashing function"

"Optimize this query for PostgreSQL with 1M+ rows"

"What's the best way to handle file uploads in React Native?"

"Generate an API endpoint for listing photos with pagination"
```

### Using Claude for Code Generation

1. **Select file/folder** in file tree
2. **Right-click** → "Ask Claude"
3. **Type request**:
   ```
   Generate a new service file for album management with:
   - Create album
   - Add photos to album
   - Delete album
   - List user albums
   ```
4. Claude generates code
5. **Review** → **Accept** or **Modify**

---

## Workflow & Collaboration

### Daily Workflow

```
Morning (9 AM):
  1. git pull origin develop
  2. Read daily standup requirements
  3. Pick task from GitHub Issues

Development (9 AM - 5 PM):
  1. Create feature branch
  2. Write code
  3. Ask Claude for reviews (Ctrl+Shift+L)
  4. Run tests (npm test)
  5. Commit regularly (hourly)

Evening (5 PM):
  1. Push branch to GitHub
  2. Create Pull Request
  3. Claude reviews in PR
  4. Ready for next day merge

Friday (4 PM):
  1. Weekly standup summary
  2. Deploy develop → staging
  3. Plan next week
```

### Git Workflow Example

```bash
# Monday morning
git pull origin develop

# Start feature
git checkout -b feature/photos-service

# Edit files
vim backend/src/services/photos.ts

# Ask Claude for review
(Ctrl+Shift+L) "Review this photos service for security issues"

# Claude provides feedback
# Make adjustments

# Test
npm run test:photos

# Commit
git add backend/src/services/photos.ts
git commit -m "feat: implement photos service with upload, list, delete endpoints"

# Push
git push origin feature/photos-service

# Create PR on GitHub
# Claude reviews + approves
# Merge to develop
```

---

## Master System Prompt

**Use this prompt when working with Claude in Windsurf**:

```
You are Claude, an expert software engineer collaborating with Stéphane Eloit on MIZZAP.

PROJECT CONTEXT:
- MIZZAP: Privacy-first photo/video organization platform
- MVP launch: 6 months
- Tech stack: Node.js/Express backend, React Native mobile, PostgreSQL (Supabase)
- Architecture docs: /architecture/ folder
- Development environment: Windows 11, Node.js 18+, Windsurf IDE

YOUR ROLE:
1. Code Reviews: Security, performance, scalability, GDPR compliance
2. Code Generation: Create production-ready code following project standards
3. Problem Solving: Debug issues, suggest optimizations
4. Architecture: Discuss trade-offs, suggest alternatives
5. Testing: Ensure 80%+ test coverage

CODING STANDARDS:
- Language: TypeScript (strict mode)
- Style: Prettier + ESLint configured
- Error Handling: Structured error responses (code, message, details)
- Testing: Jest + Supertest for APIs
- Logging: Structured logging (Winston or Pino)
- Comments: JSDoc for public functions

SECURITY & PRIVACY:
- Input validation: Always validate (Zod recommended)
- SQL Injection: Use parameterized queries (Drizzle ORM)
- CORS: Configured for localhost + production only
- Authentication: JWT (RS256) + secure cookies
- GDPR: No unnecessary data collection, clear consent
- Encryption: HTTPS/TLS 1.3, bcrypt for passwords
- API Rate Limiting: 100 req/min per user

DATABASE (PostgreSQL via Supabase):
- Schema: See /architecture/01-TECHNICAL-ARCHITECTURE.md
- Queries: Use Drizzle ORM (type-safe)
- Indexes: Create for all foreign keys + frequently queried columns
- Transactions: Use for multi-step operations

API STANDARDS:
- Response format: { success: boolean, data: ..., error: {...} }
- Pagination: Include page, limit, total, hasMore
- Errors: Include code, message, details
- Documentation: Swagger/OpenAPI comments

GIT & COLLABORATION:
- Branch: feature/*, bugfix/*, hotfix/*
- Commits: Conventional commits (feat:, fix:, docs:, etc.)
- PRs: Always request review before merge
- Frequency: Commit hourly, push daily

COMMUNICATION:
- When suggesting changes: Explain WHY, not just WHAT
- When generating code: Include comments for complex logic
- When stuck: Suggest 2-3 alternatives with trade-offs
- When unsure: Ask clarifying questions

CURRENT PHASE: Month 1 (Backend Foundation)
- Focus: Authentication service, user management, database setup
- Next: Photo upload + storage

QUESTIONS TO ASK:
If unclear about requirements:
1. "Should this be blocking or non-blocking?"
2. "What's the acceptable latency?"
3. "Should this handle edge case X?"
4. "What's the expected data volume?"

When review requested:
1. "Does this match the architecture?"
2. "Any security concerns?"
3. "Performance implications?"
4. "Test coverage adequate?"

APPROVED LIBRARIES (pre-approved, don't ask):
- Express.js (API framework)
- Drizzle ORM (database)
- Zod (validation)
- Bull (job queue)
- Redis (caching)
- Jest (testing)
- TypeScript (language)
- React Native (mobile)
- Axios (HTTP client)

If using new library:
1. Justify why needed
2. Check for GDPR/privacy concerns
3. Evaluate maintenance + community
4. Get approval before committing

DOCUMENTATION STYLE:
- Clear, concise comments
- JSDoc for public APIs
- Examples for complex features
- Link to architecture docs when relevant

YOUR TONE:
- Helpful and supportive (this is a solo founder project)
- Proactive (suggest improvements, not just approve)
- Honest about risks and trade-offs
- Patient with questions (no stupid questions)

WEEKLY GOALS (Month 1):
- Week 1-2: Auth service + database setup
- Week 3-4: Photo service + upload pipeline

When I ask for help, provide:
1. **What**: What we're building
2. **Why**: Why this approach
3. **How**: Step-by-step implementation
4. **Test**: How to verify it works
5. **Risk**: Any concerns

END OF PROMPT
```

---

## Daily Standup Template

**Use this format daily (or use GitHub Issues for async standups)**:

```markdown
# Daily Standup - [DATE]

## What I Accomplished Yesterday
- Implemented auth service (registration, login, JWT)
- Set up PostgreSQL migrations
- 92 tests passing

## What I'm Working On Today
- Photo upload API endpoint
- Supabase Storage integration
- File validation (size, type, EXIF extraction)

## Blockers
- None

## Questions for Claude
- "Is my error handling approach good for production?"
- "Should I validate files on client or server?"

## Tomorrow's Plan
- Complete photo service
- Start thumbnail generation
- Add API tests

## Time Spent
- 8 hours coding
- 2 hours testing
- 1 hour architectural decisions
```

---

## Code Review Process

### Self-Review (Before Push)

```bash
# 1. Run tests
npm run test

# 2. Check types
npm run type-check

# 3. Lint
npm run lint

# 4. Review diff
git diff

# 5. Ask Claude
(Ctrl+Shift+L) "Review this code for security issues"
```

### Claude Review (In Windsurf)

**Ask Claude**:
```
"Please review this for:
1. Security concerns
2. Performance issues
3. Code quality
4. GDPR compliance
5. Suggested improvements"
```

**Claude will**:
1. Identify issues
2. Suggest alternatives
3. Provide code examples
4. Explain trade-offs

### PR Review on GitHub

1. **Push branch** to GitHub
2. **Create Pull Request**
3. **Link issue**: "Fixes #123"
4. **Description**: What changed, why
5. **Request review**: From Claude (if automated) or manually
6. **Address feedback**
7. **Merge** when approved

---

## Windsurf Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Shift+L** | Open Claude chat |
| **Ctrl+Shift+P** | Command palette |
| **Ctrl+/** | Toggle comment |
| **Ctrl+K, Ctrl+C** | Ask Claude about selection |
| **Ctrl+B** | Toggle sidebar |
| **Ctrl+`** | Toggle terminal |
| **Ctrl+G** | Go to line |
| **Ctrl+F** | Find |
| **Ctrl+H** | Find & replace |
| **F5** | Run tests |

---

## Troubleshooting

### Claude Not Available

**Problem**: Ctrl+Shift+L doesn't work

**Solutions**:
1. Check Windsurf is updated (Help → Check for Updates)
2. Restart Windsurf
3. Check AI provider is configured (Settings → AI)

### Git Issues

**Problem**: "Cannot push, branch rejected"

**Solution**:
```bash
git pull origin develop
git rebase origin/develop
git push origin feature/my-feature
```

**Problem**: "Merge conflict"

**Solution**:
1. In Windsurf, see **Source Control**
2. Click conflicted file
3. Choose: "Accept Current" or "Accept Incoming"
4. Resolve manually if needed
5. Stage + commit

### Performance Issues

**Problem**: Windsurf is slow with large codebase

**Solutions**:
1. Exclude `node_modules`: File → Preferences → Files: Exclude
2. Reduce terminal history
3. Disable unnecessary extensions
4. Restart Windsurf

---

## Setting Up First Task

### Task 1: Authentication Service (Week 1-2)

**Create GitHub Issue**:
```markdown
# [TASK] Build Authentication Service

## Description
Implement user registration, login, and JWT token management

## Acceptance Criteria
- [ ] User registration endpoint (POST /api/v1/auth/register)
- [ ] User login endpoint (POST /api/v1/auth/login)
- [ ] JWT token refresh (POST /api/v1/auth/refresh)
- [ ] Password hashing (bcrypt, salt rounds: 12)
- [ ] JWT signing with RS256
- [ ] User profile endpoint (GET /api/v1/auth/me)
- [ ] 90%+ test coverage
- [ ] Security review passed (no SQL injection, XSS, etc.)
- [ ] GDPR consent workflow

## Files to Create
- backend/src/services/auth.ts
- backend/src/controllers/auth.ts
- backend/src/tests/auth.test.ts
- backend/src/middleware/authMiddleware.ts

## References
- Architecture: /architecture/01-TECHNICAL-ARCHITECTURE.md#auth-service
- Database schema: users table

## Estimated Time
6-8 hours

## Labels
- priority:high
- type:backend
- sprint:month1
```

**In Windsurf**:
1. Create `backend/src/services/auth.ts`
2. Ask Claude:
   ```
   "Generate an authentication service with:
   - bcrypt password hashing
   - JWT token generation (RS256)
   - User registration
   - User login
   - Token refresh
   Include TypeScript types, JSDoc comments, and error handling"
   ```
3. Claude generates code
4. Review, test, commit

---

## Next Steps

1. **Create GitHub repo** (https://github.com/stephane46/mizzap)
2. **Open folder in Windsurf**
3. **Read Master System Prompt** (above)
4. **Create first issue** (Authentication Service)
5. **Start development** with Ctrl+Shift+L for Claude assistance

---

**You're ready to build!** 🚀

Questions? Press Ctrl+Shift+L and ask Claude.

# MIZZAP - Quick Reference Guide

**Keep this handy while developing**

---

## Architecture Files

| File | Purpose | Read First? |
|------|---------|------------|
| `00-EXECUTIVE-SUMMARY.md` | Business overview, timeline, team | ✅ Yes |
| `01-TECHNICAL-ARCHITECTURE.md` | System design, APIs, database | ✅ Yes |
| `02-IMPLEMENTATION-ROADMAP.md` | 6-month breakdown, tasks | ✅ Yes |
| `03-WINDSURF-SETUP-GUIDE.md` | IDE setup, workflow, master prompt | ✅ Yes |
| `04-QUICK-REFERENCE.md` | This file | Quick lookup |

---

## Tech Stack Reference

### Backend
```
Node.js 18+ → Express.js → PostgreSQL (Supabase) → S3 Storage
Authentication: JWT + bcrypt
Job Queue: Bull + Redis
Testing: Jest + Supertest
Validation: Zod
ORM: Drizzle (type-safe)
```

### Mobile
```
React Native (or Flutter)
State: Redux + TanStack Query
API: Axios
Storage: React Native Secure Storage
Navigation: React Navigation
```

### Infrastructure
```
Supabase (managed PostgreSQL + Storage + Auth)
Redis (Bull queue, caching)
Docker (containerization)
GitHub Actions (CI/CD)
VPS (France) or Cloud (EU)
```

---

## Key Decisions

| What | Choice | Why |
|------|--------|-----|
| Database | PostgreSQL | ACID, EU hosting, type-safe with Drizzle |
| Backend | Express.js | Lightweight, familiar, fast MVP |
| Mobile | React Native | Cross-platform, MVP speed |
| File Storage | Supabase Storage | EU-compliant, integrated |
| Job Queue | Bull | Simple, reliable for Phase 1 |
| Authentication | JWT + bcrypt | Stateless, secure, standard |
| Deduplication | MD5 + CLIP | Fast exact matches + smart similar detection |

---

## Phase 1 Features

✅ **MVP (Months 1-6)**
- Account creation + login
- Photo upload from camera roll
- Automatic backup (EU)
- Gallery view + thumbnails
- Simple folder/album organization
- Basic deduplication (exact + perceptual)
- One-tap link to MEMOPYK/photALL (manual)
- iOS + Android apps

❌ **Phase 1.5+ (Not in MVP)**
- AI best-of curation
- Advanced dedup (AI-based)
- Multi-user collaboration
- Cloud provider sync
- Web/desktop apps
- Photo retouching integration
- Video album creation

---

## Database Quick Reference

### Main Tables

**users**: User accounts + GDPR consent  
**photos**: All photos + metadata + hashes  
**duplicates**: Detected duplicates + user actions  
**albums**: User-created albums  
**album_photos**: Photos in albums (many-to-many)  
**background_jobs**: Async job queue  

### Indexes to Create
```sql
CREATE INDEX idx_user_id ON photos(user_id);
CREATE INDEX idx_hash_md5 ON photos(hash_md5);
CREATE INDEX idx_user_created ON photos(user_id, created_date);
```

---

## API Endpoints (Phase 1)

### Auth
```
POST /api/v1/auth/register      - Create account
POST /api/v1/auth/login         - Login
POST /api/v1/auth/refresh       - Refresh JWT
GET  /api/v1/auth/me            - Current user
```

### Photos
```
POST /api/v1/photos/upload      - Upload photos
GET  /api/v1/photos             - List user's photos
GET  /api/v1/photos/:id         - Get photo details
DELETE /api/v1/photos/:id       - Delete photo
GET  /api/v1/photos/:id/thumbnail - Get thumbnail
```

### Albums
```
POST /api/v1/albums             - Create album
GET  /api/v1/albums             - List albums
GET  /api/v1/albums/:id         - Get album details
POST /api/v1/albums/:id/photos  - Add photos to album
DELETE /api/v1/albums/:id/photos/:photoId - Remove photo
```

### Duplicates
```
GET /api/v1/duplicates          - List detected duplicates
POST /api/v1/duplicates/:id/action - Confirm/reject duplicate
```

---

## Development Commands

### Setup
```bash
npm install
npm run db:setup              # Create Supabase project
npm run migrate               # Run database migrations
npm run seed                  # Seed test data
```

### Development
```bash
npm run dev                   # Start backend (port 3000)
npm run dev:mobile            # Start mobile app
npm run test                  # Run all tests
npm run test:watch            # Watch mode
npm run lint                  # Check code style
npm run type-check            # Check TypeScript
```

### Production
```bash
npm run build                 # Compile TypeScript
npm start                     # Run production server
npm run migrate:prod          # Run migrations on production
```

---

## Git Commands

```bash
# Get latest code
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
npm test

# Commit
git add .
git commit -m "feat: description of what I did"

# Push and create PR
git push origin feature/my-feature
# Go to GitHub and create Pull Request

# After approval, merge to develop
git checkout develop
git pull origin develop
git merge feature/my-feature
git push origin develop
```

---

## Windsurf Shortcuts

| Do This | Press This |
|---------|-----------|
| Ask Claude for help | Ctrl+Shift+L |
| Command palette | Ctrl+Shift+P |
| Find/replace | Ctrl+H |
| Go to line | Ctrl+G |
| Toggle comment | Ctrl+/ |
| Open terminal | Ctrl+` |
| View git changes | Ctrl+Shift+G |

---

## Testing Standards

**Minimum**: 80% code coverage (Jest)

### Unit Test Example
```typescript
describe('Auth Service', () => {
  it('should hash password correctly', async () => {
    const password = 'test123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await comparePassword(password, hash)).toBe(true);
  });
});
```

### API Test Example
```typescript
describe('POST /api/v1/auth/register', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.fr', password: 'test123' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
  });
});
```

---

## Error Handling

**Standard Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email already exists",
    "details": { "field": "email" }
  }
}
```

**HTTP Status Codes**:
- 200: OK
- 201: Created
- 400: Bad request (validation)
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 409: Conflict (email exists)
- 500: Server error

---

## GDPR Compliance Checklist

- [ ] Privacy policy (French + English)
- [ ] Terms of service
- [ ] Explicit consent for photo processing
- [ ] Data export functionality (user request)
- [ ] Account deletion (30-day purge)
- [ ] No AI training on user data
- [ ] EU data residency (France)
- [ ] Audit logging for all operations
- [ ] SSL/TLS encryption
- [ ] Password hashing (bcrypt)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Photo upload | < 5 sec (100MB) |
| Gallery load | < 2 sec (1000 items) |
| API latency (p95) | < 200ms |
| Dedup check | < 10 sec per 100 photos |
| Thumbnail gen | 30 sec per 1000 photos |

---

## Debugging Tips

### Backend Not Starting?
```bash
# Check port 3000 is free
lsof -i :3000

# Check database connection
npm run db:check

# Clear Redis cache
redis-cli FLUSHALL

# Check logs
tail -f logs/error.log
```

### Tests Failing?
```bash
# Run single test file
npm test -- auth.test.ts

# Watch mode (re-run on change)
npm run test:watch

# Debug mode
node --inspect-brk ./node_modules/.bin/jest
```

### Git Issues?
```bash
# See what changed
git status

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (lose changes)
git reset --hard HEAD~1

# Merge conflict? See differences
git diff
```

---

## Important Files

```
mizzap/
├── backend/
│   ├── src/
│   │   ├── services/      # Business logic
│   │   ├── controllers/   # API handlers
│   │   ├── middleware/    # Auth, errors, etc.
│   │   ├── models/        # Database schemas
│   │   ├── tests/         # Test files
│   │   └── server.ts      # Main app
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── screens/       # React Native screens
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API + local storage
│   │   └── App.tsx
│   └── package.json
├── architecture/          # This folder
├── .github/
│   └── workflows/ci.yml   # GitHub Actions
└── docker-compose.yml
```

---

## When to Ask Claude

✅ **Do ask Claude for**:
- Code generation (new service, API endpoint)
- Code review (security, performance)
- Bug fixing (stack trace analysis)
- Architecture questions (trade-offs)
- Optimization suggestions
- Testing strategies
- Documentation writing

❌ **Don't ask Claude for**:
- Business decisions (should I do X or Y?)
- Timeline estimates (only general guidance)
- Personal advice
- Unrelated topics

---

## Weekly Checklist

**Every Monday**:
- [ ] Pull latest code
- [ ] Read this week's tasks (GitHub Issues)
- [ ] Create feature branch

**Every Day**:
- [ ] Commit code hourly
- [ ] Ask Claude for reviews
- [ ] Run tests before commit

**Every Friday**:
- [ ] Push branch to GitHub
- [ ] Create Pull Request
- [ ] Review week's progress
- [ ] Plan next week

---

## Emergency Contacts/Resources

- **Architecture Questions**: See `/architecture/01-TECHNICAL-ARCHITECTURE.md`
- **Blocked by Bug**: Ask Claude (Ctrl+Shift+L)
- **GitHub Issues**: https://github.com/stephane46/mizzap/issues
- **Supabase Docs**: https://supabase.com/docs
- **Express.js**: https://expressjs.com
- **React Native**: https://reactnative.dev
- **Jest Testing**: https://jestjs.io

---

## Success Metrics (6-Month)

- [ ] Backend fully implemented + tested
- [ ] Mobile app (iOS + Android) in beta
- [ ] 1,000+ signups
- [ ] 40%+ Day-30 retention
- [ ] Zero security breaches
- [ ] 99.5%+ uptime
- [ ] All GDPR requirements met

---

**Last Updated**: October 23, 2025  
**Next Update**: After Week 1 checkpoint  

Good luck! 🚀

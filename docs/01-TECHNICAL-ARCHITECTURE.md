# MIZZAP - Technical Architecture Document

**Version**: 1.0  
**Last Updated**: October 23, 2025  
**Audience**: Developers, DevOps, Product Team  

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Flow](#data-flow)
4. [Database Schema](#database-schema)
5. [Backend Services](#backend-services)
6. [Mobile App Architecture](#mobile-app-architecture)
7. [AI/ML Pipeline](#aiml-pipeline)
8. [File Storage & CDN](#file-storage--cdn)
9. [Privacy & Security](#privacy--security)
10. [Scalability & Performance](#scalability--performance)
11. [Deployment & DevOps](#deployment--devops)
12. [API Specification](#api-specification)
13. [Phase 2 Architecture Changes](#phase-2-architecture-changes)

---

## System Overview

MIZZAP is a **privacy-first, AI-powered photo/video organization platform** that:
1. Accepts uploads from mobile devices
2. Deduplicates and curates photos/videos
3. Stores media in EU-compliant infrastructure
4. Provides gallery/album UI on mobile
5. Integrates with MEMOPYK/photALL for premium services

### Architecture Principles

- **Privacy-First**: All data in EU, no tracking, GDPR-compliant
- **Local-First**: Process photos on device when possible
- **Modular**: Microservices for dedup, curation, storage
- **Scalable**: Designed for 1TB/day upload volume
- **Type-Safe**: TypeScript throughout backend and mobile

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (iOS/Android)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Camera Roll  │  │   Upload     │  │   Gallery    │          │
│  │   Import     │  │   Manager    │  │   Viewer     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                   │                 │
│         └─────────────────┼───────────────────┘                 │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  Local Sync  │                              │
│                    │   Engine     │                              │
│                    └──────┬──────┘                               │
│                           │ (HTTPS)                             │
└───────────────────────────┼──────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐      ┌──────▼──────┐    ┌──────▼──────┐
   │   API   │      │   WebSocket  │    │  CDN/Cache  │
   │ Gateway │◄────►│   Server     │    │  (Cloudflare)
   └────┬────┘      └──────┬──────┘    └─────────────┘
        │                   │
        └───────────────────┼───────────┐
                            │           │
        ┌───────────────────▼─┐  ┌──────▼──────────┐
        │   Auth Service      │  │  REST API      │
        │  (JWT + Sessions)   │  │  (/api/v1/...)  │
        └──────────┬──────────┘  └────────────────┘
                   │
        ┌──────────┼──────────┬────────────────┐
        │          │          │                │
   ┌────▼────┐ ┌──▼────┐ ┌───▼────┐    ┌─────▼─────┐
   │  Photos │ │Albums │ │ Users  │    │   Jobs    │
   │Service  │ │Service│ │Service │    │  Service  │
   └────┬────┘ └──┬────┘ └───┬────┘    └─────┬─────┘
        │         │          │              │
        └─────────┼──────────┼──────────────┤
                  │          │              │
        ┌─────────▼──────────▼──────────────▼────┐
        │      PostgreSQL (Supabase)              │
        │   ┌──────────────────────────────┐     │
        │   │ Users, Photos, Albums,       │     │
        │   │ Duplicates, Metadata, etc.   │     │
        │   └──────────────────────────────┘     │
        └─────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  Supabase   │  │  Bull Queue │  │    Redis    │
   │  Storage    │  │  (Dedup,    │  │   (Cache,   │
   │  (S3)       │  │   Thumbs,   │  │    Sessions)│
   │             │  │   Curation) │  │             │
   └─────────────┘  └─────────────┘  └─────────────┘
        │                  │
        │                  │
   ┌────▼──────────────────▼────┐
   │  Background Workers        │
   │  (Dedup, AI, Processing)   │
   └────────────────────────────┘
```

---

## Data Flow

### Upload & Backup Flow

```
1. User selects photos in iOS/Android app
              ↓
2. App calculates local hashes (MD5/SHA256)
              ↓
3. App checks against local cache for duplicates
              ↓
4. App uploads to backend with metadata
              ↓
5. Backend stores in Supabase Storage (S3)
              ↓
6. Backend enqueues deduplication job
              ↓
7. Background worker processes dedup
              ↓
8. Results stored in PostgreSQL
              ↓
9. WebSocket notifies app of completion
              ↓
10. App updates gallery view
```

### Deduplication Flow

```
Incoming Photo
     ↓
Byte-for-Byte Hash Check (MD5)
     ├─ Exact Match? → Mark as duplicate, skip
     └─ No Match? Continue
     ↓
Perceptual Hash Check (CLIP embeddings v1)
     ├─ Similar? → Flag for user review
     └─ Different? Continue
     ↓
Store hash + metadata in PostgreSQL
     ↓
Add to user's library
```

### AI Curation Flow (Phase 1.5+)

```
User Library (500+ photos)
     ↓
Batch scoring with CLIP/ResNet
     ├─ Quality scores
     ├─ Aesthetic scores
     └─ Semantic tags
     ↓
Clustering similar photos
     ↓
Select top N per cluster (20 highlights)
     ↓
Present to user as "Best Of"
     ↓
User confirms/modifies
     ↓
Store curated set
     ↓
Offer MEMOPYK/photALL integration
```

---

## Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  full_name VARCHAR(255),
  country VARCHAR(2) DEFAULT 'FR',
  privacy_accepted BOOLEAN DEFAULT FALSE,
  gdpr_consent_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);
```

#### `photos`
```sql
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  file_size BIGINT,
  mime_type VARCHAR(50),
  
  -- Hashes for deduplication
  hash_md5 VARCHAR(32),
  hash_sha256 VARCHAR(64),
  hash_perceptual VARCHAR(255),
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  created_date TIMESTAMP,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  camera_model VARCHAR(255),
  
  -- Status
  upload_status ENUM('pending', 'uploaded', 'processed', 'failed'),
  has_duplicates BOOLEAN DEFAULT FALSE,
  quality_score FLOAT,
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_hash (user_id, hash_md5),
  INDEX idx_user_created (user_id, created_date)
);
```

#### `duplicates`
```sql
CREATE TABLE duplicates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  primary_photo_id INTEGER REFERENCES photos(id),
  duplicate_photo_id INTEGER REFERENCES photos(id),
  
  -- Match type
  match_type ENUM('exact', 'perceptual', 'ai'),
  similarity_score FLOAT (0.0-1.0),
  
  -- User action
  action ENUM('pending', 'confirmed', 'rejected', 'kept_both'),
  action_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_duplicates (user_id, action)
);
```

#### `albums`
```sql
CREATE TABLE albums (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  description TEXT,
  cover_photo_id INTEGER REFERENCES photos(id),
  
  visibility ENUM('private', 'shared'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_albums (user_id, created_at)
);
```

#### `album_photos`
```sql
CREATE TABLE album_photos (
  id SERIAL PRIMARY KEY,
  album_id INTEGER REFERENCES albums(id),
  photo_id INTEGER REFERENCES photos(id),
  position INTEGER,
  added_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  INDEX idx_album_photos (album_id, position)
);
```

#### `background_jobs`
```sql
CREATE TABLE background_jobs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  photo_id INTEGER REFERENCES photos(id),
  
  job_type ENUM('dedup', 'thumbnail', 'ai_score', 'metadata_extract'),
  status ENUM('queued', 'processing', 'completed', 'failed'),
  
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pending_jobs (job_type, status)
);
```

---

## Backend Services

### 1. Auth Service

**Endpoints**:
```
POST   /api/v1/auth/register         - Create account
POST   /api/v1/auth/login            - Login + JWT token
POST   /api/v1/auth/refresh          - Refresh token
POST   /api/v1/auth/logout           - Logout
GET    /api/v1/auth/me               - Get current user
PUT    /api/v1/auth/profile          - Update profile
```

**Authentication**: JWT + Session cookies (GDPR-compliant consent)

### 2. Photos Service

**Endpoints**:
```
POST   /api/v1/photos/upload         - Upload photos
GET    /api/v1/photos                - List user's photos
GET    /api/v1/photos/:id            - Get photo details
DELETE /api/v1/photos/:id            - Delete photo
GET    /api/v1/photos/:id/thumbnail  - Get thumbnail
POST   /api/v1/photos/batch-action   - Bulk delete/organize
```

**Response** (GET /api/v1/photos):
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "fileName": "IMG_001.jpg",
      "fileSize": 2048576,
      "uploadedAt": "2025-10-23T10:00:00Z",
      "hasDuplicates": true,
      "duplicateCount": 2,
      "width": 1920,
      "height": 1080,
      "createdDate": "2025-10-20",
      "thumbnailUrl": "/api/v1/photos/123/thumbnail",
      "qualityScore": 0.85
    }
  ],
  "pagination": {
    "total": 5000,
    "page": 1,
    "limit": 20
  }
}
```

### 3. Albums Service

**Endpoints**:
```
POST   /api/v1/albums                - Create album
GET    /api/v1/albums                - List user's albums
GET    /api/v1/albums/:id            - Get album details
PUT    /api/v1/albums/:id            - Update album
DELETE /api/v1/albums/:id            - Delete album
POST   /api/v1/albums/:id/photos     - Add photos to album
DELETE /api/v1/albums/:id/photos/:photoId - Remove photo
```

### 4. Duplicates Service

**Endpoints**:
```
GET    /api/v1/duplicates            - List detected duplicates
GET    /api/v1/duplicates/stats      - Dedup statistics
POST   /api/v1/duplicates/:id/action - Mark as confirmed/rejected/kept
POST   /api/v1/duplicates/bulk-action- Bulk duplicate actions
```

**Response** (GET /api/v1/duplicates):
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "primaryPhotoId": 123,
      "duplicatePhotoId": 124,
      "matchType": "exact",
      "similarityScore": 1.0,
      "action": "pending",
      "primaryPhoto": { "id": 123, "fileName": "IMG_001.jpg" },
      "duplicatePhoto": { "id": 124, "fileName": "IMG_001_copy.jpg" }
    }
  ],
  "stats": {
    "totalDuplicates": 1203,
    "spaceToFree": "15.2 GB",
    "duplicatePercentage": 24.1
  }
}
```

### 5. Integration Service (MEMOPYK/photALL)

**Endpoints**:
```
POST   /api/v1/integrations/memopyk/create-film - Request film creation
POST   /api/v1/integrations/photall/send-for-retouch - Send for retouching
GET    /api/v1/integrations/status  - Check integration status
```

---

## Mobile App Architecture

### Technology: React Native (or Flutter)

**Rationale**: Cross-platform (iOS + Android), fast MVP, familiar to team

### App Structure

```
mizzap-mobile/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Gallery/
│   │   │   ├── GalleryScreen.tsx
│   │   │   ├── PhotoDetailScreen.tsx
│   │   │   └── AlbumListScreen.tsx
│   │   ├── Duplicates/
│   │   │   ├── DuplicatesScreen.tsx
│   │   │   └── DuplicateReviewScreen.tsx
│   │   └── Settings/
│   │       ├── SettingsScreen.tsx
│   │       └── AccountScreen.tsx
│   ├── components/
│   │   ├── PhotoGrid.tsx
│   │   ├── UploadManager.tsx
│   │   ├── DuplicateCard.tsx
│   │   └── AlbumCard.tsx
│   ├── services/
│   │   ├── api.ts (REST client)
│   │   ├── auth.ts
│   │   ├── photos.ts
│   │   └── storage.ts (local)
│   ├── hooks/
│   │   ├── usePhotos.ts
│   │   ├── useDuplicates.ts
│   │   └── useAuth.ts
│   ├── store/ (Redux/Zustand)
│   │   ├── authSlice.ts
│   │   ├── photosSlice.ts
│   │   └── uiSlice.ts
│   ├── utils/
│   │   ├── hashing.ts (local MD5/SHA256)
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── App.tsx
├── app.json
├── package.json
└── README.md
```

### Key Mobile Features

1. **Camera Roll Import**
   - Native module to access device camera roll
   - Filter by date range, media type
   - Local duplicate check before upload

2. **Upload Manager**
   - Chunked uploads (resumable)
   - Progress tracking
   - Background upload queue
   - Retry on failure

3. **Gallery View**
   - Virtual scrolling (10K+ items)
   - Filter by date, album, quality
   - Search by filename, location, camera
   - Quick actions (delete, move to album, mark as best)

4. **Offline Support**
   - Local cache of photos + metadata
   - Queue actions offline
   - Sync when reconnected

5. **Real-Time Notifications**
   - WebSocket updates for long operations
   - Badge notifications for dedup results
   - Integration prompts (MEMOPYK/photALL)

---

## AI/ML Pipeline

### Phase 1: Basic Deduplication

**Models Used**:
- **MD5/SHA256**: Byte-for-byte hashing (fast, accurate for exact matches)
- **CLIP Embeddings** (v1 perceptual hashing): 512-dim vectors for similarity matching

**Process**:
```
1. User uploads photo
2. Calculate MD5 hash
3. Query PostgreSQL: SELECT * FROM photos WHERE hash_md5 = ?
4. If match found → Flag as exact duplicate
5. If no match:
   a. Calculate CLIP embedding (local or API)
   b. Store embedding in PostgreSQL
   c. Query for similar embeddings (cosine similarity > 0.95)
   d. If match → Flag for user review
6. Store photo + hashes in database
```

### Phase 1.5+: Advanced Curation

**Models**:
- **ResNet50** or **EfficientNet**: Quality scoring
- **CLIP** or **BLIP**: Semantic understanding
- **Clustering**: Group similar photos

**Process**:
```
1. User has 500+ photos
2. Batch score all photos:
   a. Quality score (sharpness, exposure, composition)
   b. Aesthetic score (colors, balance, appeal)
   c. CLIP embeddings (content understanding)
3. Cluster similar photos (K-means on embeddings)
4. Per cluster: Select top 1-2 highest quality
5. Present to user: "Your 20 Best Moments"
6. User confirms/customizes
7. Curated set ready for MEMOPYK/photALL
```

### Infrastructure

**Option A: On-Device (Preferred for Privacy)**
- TensorFlow Lite models on mobile
- Fast inference, no cloud calls, full privacy
- Trade-off: Larger app size, more battery

**Option B: Server-Side**
- Models run on backend workers
- Smaller app, but privacy implications
- Better for complex models

**Hybrid (Recommended)**
- Simple models on-device (hashing, initial quality check)
- Complex models server-side (curation, semantic tagging)
- User consent for server processing

---

## File Storage & CDN

### Storage Architecture

```
User Uploads
      ↓
Supabase Storage (S3-compatible)
      ├─ /user-{id}/originals/
      ├─ /user-{id}/thumbnails/
      └─ /user-{id}/backups/
      ↓
CDN (Cloudflare or Supabase CDN)
      ↓
Mobile App Gallery View
```

### Storage Tiers

| Tier | Originals | Thumbnails | Backups | Retention |
|------|-----------|-----------|---------|-----------|
| **Free** | 10GB | Yes | 7 days | Indefinite |
| **Premium** | Unlimited | Yes | 30 days | Indefinite |

### Thumbnail Generation

```
Photo Upload
      ↓
Backend Enqueues Thumbnail Job
      ↓
Worker Processes with Sharp:
  - 200x200px (thumbnail)
  - 400x400px (preview)
  - 1200x1200px (web preview)
      ↓
Stored in /user-{id}/thumbnails/
      ↓
CDN Caches (1 year TTL)
      ↓
Mobile App Uses Cached Thumbnails
```

---

## Privacy & Security

### GDPR Compliance

1. **Data Residency**
   - All data stored in France (EU)
   - No cross-border transfers without explicit consent
   - Option to add multi-region EU support later

2. **Consent Management**
   - Explicit opt-in for photo processing
   - Clear privacy policy (French + English)
   - Users can request data export/deletion

3. **Data Processing**
   - Photos processed on-device when possible
   - Server-side processing logged + consented
   - AI models don't train on user data

4. **Retention**
   - User data deleted within 30 days of account deletion
   - Backup retention: 7-30 days (user-selectable)
   - Logs purged after 90 days

### Security Measures

1. **Authentication**
   - Password hashing: bcrypt (salt rounds: 12)
   - JWT tokens: Signed with RS256, 1-hour expiry
   - Session cookies: HttpOnly, Secure, SameSite=Strict

2. **Encryption**
   - HTTPS/TLS 1.3 for all API calls
   - File encryption at rest (optional, Phase 2)
   - Sensitive data encrypted in database (email, location)

3. **API Security**
   - Rate limiting: 100 req/min per user
   - CORS: Only localhost + production domain
   - Input validation: Zod + TypeScript
   - SQL injection prevention: Parameterized queries

4. **Audit Logging**
   - All file operations logged (user, action, timestamp)
   - Deletion logs kept for 90 days
   - Access patterns monitored for suspicious activity

---

## Scalability & Performance

### Performance Targets

| Metric | Target |
|--------|--------|
| Photo upload | <5 sec (100MB) |
| Gallery load | <2 sec (1000 items) |
| Dedup detection | <10 sec per 100 photos |
| API p95 latency | <200ms |
| Thumbnail generation | 30 sec per 1000 photos |

### Scaling Strategy

**Phase 1** (1-10K users):
- Single VPS (8 CPU, 32GB RAM)
- PostgreSQL on same server
- Redis for cache/queue
- Supabase managed storage

**Phase 1.5** (10-100K users):
- API servers: 3 instances (load balanced)
- PostgreSQL: Managed Supabase
- Redis cluster: 3 nodes
- Background workers: 5-10 instances
- CDN: Cloudflare

**Phase 2** (100K+ users):
- Kubernetes cluster
- PostgreSQL sharding by user_id
- Separate read replicas
- Distributed caching (Redis cluster)
- Message queue: RabbitMQ or Kafka
- Multiple regions (EU)

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_user_id ON photos(user_id);
CREATE INDEX idx_hash_md5 ON photos(hash_md5);
CREATE INDEX idx_user_created ON photos(user_id, created_date);
CREATE INDEX idx_duplicate_user ON duplicates(user_id, action);
CREATE INDEX idx_album_user ON albums(user_id);

-- Partitioning (when table > 1B rows)
CREATE TABLE photos_2025_10 PARTITION OF photos
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

### Caching Strategy

```
API Gateway
      ↓
Cache Layer (Redis):
  - User session data (30 min TTL)
  - Album list (5 min TTL)
  - Photo metadata (10 min TTL)
  - Thumbnail URLs (1 hour TTL)
      ↓
If miss: Query PostgreSQL
      ↓
Update cache
```

---

## Deployment & DevOps

### Infrastructure

```
VPS (Hetzner or similar in France)
├── API Server (Node.js + Express)
├── Background Workers (Bull)
├── PostgreSQL (Supabase managed)
├── Redis (ElastiCache or self-hosted)
└── Nginx (reverse proxy)

Object Storage
├── Supabase Storage (EU)
└── CDN (Cloudflare)

External Services
├── Supabase Auth (managed)
├── GitHub (code repo)
└── Monitoring (DataDog or Sentry)
```

### CI/CD Pipeline

```
Developer commits to GitHub
      ↓
GitHub Actions triggered
      ↓
Run tests:
  - Unit tests (Jest)
  - Integration tests
  - Type checking (TypeScript)
      ↓
Build Docker image
      ↓
Push to registry
      ↓
Deploy to VPS (automated)
      ↓
Run smoke tests
      ↓
Monitor for errors (Sentry)
```

### Monitoring & Alerting

```
Application Metrics:
- Request latency (p50, p95, p99)
- Error rate
- Queue depth (background jobs)
- Active users

Infrastructure Metrics:
- CPU/Memory usage
- Disk I/O
- Network bandwidth
- Database connection pool

Alerts:
- Error rate > 1%
- p95 latency > 500ms
- Queue depth > 10K jobs
- Disk usage > 80%
```

---

## API Specification

### Authentication

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**JWT Payload**:
```json
{
  "sub": "user_123",
  "email": "user@example.fr",
  "iat": 1698055200,
  "exp": 1698058800
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "File size exceeds 100MB limit",
    "details": {
      "field": "fileSize",
      "value": 150000000
    }
  }
}
```

### Pagination

```
GET /api/v1/photos?page=2&limit=50&sortBy=createdDate&sortOrder=desc

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 5000,
    "hasMore": true,
    "totalPages": 100
  }
}
```

---

## Phase 2 Architecture Changes

### Multi-User Collaboration

**New Tables**:
```sql
CREATE TABLE families (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP
);

CREATE TABLE family_members (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id),
  user_id INTEGER REFERENCES users(id),
  role ENUM('owner', 'member', 'viewer'),
  UNIQUE(family_id, user_id)
);

CREATE TABLE shared_albums (
  id SERIAL PRIMARY KEY,
  album_id INTEGER REFERENCES albums(id),
  family_id INTEGER REFERENCES families(id),
  visibility ENUM('family', 'private')
);
```

### WebSocket Events

```
Connection: ws://api.mizzap.fr/ws?token={jwt}

Events Published:
- photo:uploaded
- photo:processed
- duplicate:detected
- album:updated
- user:joined_family
```

### Desktop/Web App

**Technology**: Same React + TypeScript
- Responsive design (works on desktop)
- Advanced filtering + search
- Batch operations
- Advanced album creation

**Desktop Client** (Electron or Tauri):
- Local cache for offline access
- Faster performance
- System tray integration
- Native file dialogs

---

## Implementation Notes

### Technology Decisions

| Decision | Why | Alternative |
|----------|-----|-------------|
| PostgreSQL | ACID, EU hosting (Supabase), type-safe with Drizzle | MongoDB (less relational data) |
| Express.js | Lightweight, familiar, fast to build | NestJS (more structured, but heavier) |
| React Native | Cross-platform, MVP speed | Flutter (more mature, less familiar) |
| Redis | Job queue, caching, simple | Kafka (overkill for Phase 1) |
| Supabase | Managed PostgreSQL + Storage + Auth | AWS (more complexity) |
| Bull | Job queue library | RabbitMQ (more ops overhead) |
| CLIP | Open-source, privacy-first | Commercial APIs (vendor lock-in) |

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| CLIP model quality | Start simple, iterate on user feedback |
| Performance at 1M photos | Batch processing, caching, indexing |
| Privacy compliance | Regular GDPR audits, clear policies |
| Duplicate detection false positives | Always require user confirmation |
| Cloud provider outage | Multi-region backup, data exports |

---

**Next Step**: Implement detailed API specification and begin backend development.

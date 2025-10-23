# MIZZAP - Executive Summary

**Project**: MIZZAP - Privacy-First Photo & Video Organization Platform  
**Version**: 1.0  
**Last Updated**: October 23, 2025  
**Author**: Stéphane Eloit  

---

## 🎯 Vision

MIZZAP helps modern families bring order, emotion, and meaning back to their photo and video memories. We own the space between storage and storytelling—providing privacy-first deduplication, intelligent curation, and a direct path to professional film creation (MEMOPYK) and photo retouching (photALL).

**Guiding Principle**: "We don't just store memories — we help people feel them again."

---

## 💼 Business Model

| Phase | Target | Model | Timeline |
|-------|--------|-------|----------|
| **Phase 1 (MVP)** | Individuals | Free app + basic backup | Months 1-6 |
| **Phase 1.5** | Individuals | Free tier (10GB/10K photos) + paid upgrades | Month 6-9 |
| **Phase 2** | Families | Collaboration + family sharing (Premium) | Month 9-12 |

**Monetization Paths**:
1. **Free Tier**: 10GB/10K photos, basic dedup, ads-free
2. **Premium Tier**: Unlimited storage, advanced AI curation, family collaboration ($9.99-14.99/month)
3. **Service Integration**: 20-30% commission on MEMOPYK films and photALL retouching

---

## 📱 Product Phases

### Phase 1 (MVP) - 6 Months
**Goal**: Individuals solve "media chaos"

**Core Features**:
- Account creation + secure auth
- Camera roll import + direct upload
- Automatic backup to EU servers
- Basic deduplication (byte-for-byte + perceptual hashing v1)
- Gallery view + simple folder/album organization
- Thumbnail generation + metadata extraction
- One-tap link to MEMOPYK/photALL (manual trigger)

**Not in MVP**:
- AI-powered best-of curation
- Advanced dedup (perceptual v2, AI-based)
- Multi-user collaboration
- Cloud provider sync (Google Drive, OneDrive, iCloud)
- Web/desktop apps

### Phase 1.5 (3 Months)
**Goal**: Monetize and stabilize

**Additions**:
- AI best-of curation engine (500 → 20 highlights)
- Paid tier + subscription model
- Advanced duplicate detection
- Better mobile UX/performance

### Phase 2 (Months 9-12)
**Goal**: Family collaboration + premium features

**Additions**:
- Multi-user shared spaces
- Real-time sync across devices
- Family privacy controls
- Desktop/web apps
- Cloud provider integration

---

## 🏗️ Technical Stack (Phase 1)

| Layer | Technology | Why |
|-------|------------|-----|
| **Mobile (iOS/Android)** | React Native or Flutter | Cross-platform, fast MVP |
| **Backend** | Node.js + Express (TypeScript) | Familiar, scalable, type-safe |
| **Database** | PostgreSQL (Supabase) | ACID transactions, EU hosting |
| **File Storage** | Supabase Storage (S3-compatible) | EU-compliant, integrated with Supabase |
| **Job Queue** | Bull + Redis | Background processing (dedup, thumbnails) |
| **AI/ML** | Open-source models (CLIP, etc.) + hosted in-house | Privacy-first, no vendor lock-in |
| **DevOps** | Docker + VPS (self-hosted) | Cost control, data sovereignty |

---

## 👥 Team & Resources

- **Founder/Lead Developer**: Stéphane Eloit (full-time)
- **Contractors**: Mobile UI specialist, Cloud engineer (as needed)
- **Infrastructure**: Supabase + self-hosted VPS in France
- **Budget**: Lean MVP, scale post-launch

---

## 📊 Success Metrics (Phase 1)

- **User Acquisition**: 1,000 signups by month 3, 10,000 by launch
- **Engagement**: 60%+ monthly active users
- **Retention**: 40%+ Day-30 retention
- **Storage Efficiency**: Average 30% duplicate removal per user
- **Upsell Intent**: 15%+ of users click MEMOPYK/photALL links

---

## 🚀 Go-to-Market

**Launch Strategy**:
1. Soft launch in France (friends, family, beta community)
2. PR: "Privacy-first alternative to Google Photos"
3. Partnerships: Design blogs, privacy advocates, family tech communities
4. Growth: Viral loop (space saved + sharing results)

**Key Messaging**:
- "From chaos to keepsake—privately."
- "Your photos stay in Europe. Your memories stay yours."
- "No tracking. No ads. No lock-in."

---

## ⚠️ Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Duplicate detection accuracy | UX blocker if incorrect | Extensive QA + user control (confirmation before delete) |
| Performance at scale (1M+ photos) | Churn if slow | Local processing + batch jobs + caching |
| Privacy/GDPR compliance | Legal + reputation | Privacy-first design, EU-only data, explicit consent |
| Market competition (Google, Apple) | Low differentiation | Focus on privacy + dedup + curation (not just storage) |
| AI model quality | Poor curation = low upsell | Start with curated models, iterate on feedback |

---

## 📈 12-Month Roadmap

```
Month 1-2:   Backend architecture, authentication, storage setup
Month 3-4:   Mobile app UI/UX, camera roll import, basic dedup
Month 5-6:   Testing, optimization, beta launch
Month 6-7:   Public launch, marketing, Phase 1.5 planning
Month 8-9:   AI curation engine, paid tier rollout
Month 10-12: Phase 2 features (collaboration, desktop/web)
```

---

## 💡 Next Steps

1. **Approve architecture** (this document)
2. **Set up development environment** (Git + Windsurf)
3. **Detailed technical specification** (backend, mobile, AI)
4. **Sprint planning** (Week 1-2 tasks)
5. **Begin development** (Month 1)

---

**Contact**: Stéphane Eloit  
**GitHub**: https://github.com/stephane46  
**Repository**: https://github.com/stephane46/mizzap

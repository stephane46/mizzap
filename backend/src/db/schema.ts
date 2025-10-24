import { pgTable, uuid, varchar, timestamp, boolean, bigint, integer, jsonb } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Subscription tier enum
 */
export const subscriptionTiers = ['free', 'pro', 'enterprise'] as const;
export type SubscriptionTier = (typeof subscriptionTiers)[number];

/**
 * User preferences interface
 */
export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
  };
}

/**
 * Privacy settings interface
 */
export interface PrivacySettings {
  euDataResidency: boolean;
  gdprConsent: boolean;
  consentDate: string;
}

/**
 * MIZZAP Users Table Schema
 * Linked to Supabase auth.users via foreign key
 */
export const mizzapUsers = pgTable('mizzap_users', {
  // Primary key - links to auth.users.id
  id: uuid('id').primaryKey().notNull(),
  
  // User identification
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  bio: varchar('bio', { length: 1000 }),
  
  // Subscription & storage
  subscriptionTier: varchar('subscription_tier', { length: 20 })
    .notNull()
    .default('free'),
  storageQuotaBytes: bigint('storage_quota_bytes', { mode: 'number' }).notNull().default(5368709120), // 5GB in bytes
  storageUsedBytes: bigint('storage_used_bytes', { mode: 'number' }).notNull().default(0),
  
  // Privacy & GDPR
  privacySettings: jsonb('privacy_settings').$type<PrivacySettings>().notNull(),
  
  // User preferences
  preferences: jsonb('preferences').$type<UserPreferences>().notNull(),
  
  // Account status
  isActive: boolean('is_active').notNull().default(true),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
  
  // Last login tracking
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

/**
 * TypeScript types inferred from schema
 */
export type MizzapUser = InferSelectModel<typeof mizzapUsers>;
export type NewMizzapUser = InferInsertModel<typeof mizzapUsers>;

/**
 * User DTO for API responses (excludes sensitive data)
 */
export type UserDTO = Omit<MizzapUser, 'deletedAt'> & {
  storageUsedGB: number;
  storageQuotaGB: number;
};

/**
 * Upload status enum
 */
export const uploadStatuses = ['pending', 'uploaded', 'processed', 'failed'] as const;
export type UploadStatus = (typeof uploadStatuses)[number];

/**
 * Photos Table Schema
 * Stores all uploaded photos with metadata and hashes for deduplication
 */
export const photos = pgTable('photos', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // User relationship
  userId: uuid('user_id').notNull().references(() => mizzapUsers.id, { onDelete: 'cascade' }),
  
  // File information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(), // Supabase Storage path
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  
  // Hashes for deduplication
  hashMd5: varchar('hash_md5', { length: 32 }),
  hashSha256: varchar('hash_sha256', { length: 64 }),
  hashPerceptual: varchar('hash_perceptual', { length: 255 }), // CLIP embedding hash
  
  // Image metadata
  width: integer('width'),
  height: integer('height'),
  durationSeconds: integer('duration_seconds'), // For videos
  
  // EXIF data
  createdDate: timestamp('created_date', { withTimezone: true }), // From EXIF
  locationLatitude: varchar('location_latitude', { length: 20 }),
  locationLongitude: varchar('location_longitude', { length: 20 }),
  cameraModel: varchar('camera_model', { length: 255 }),
  
  // Upload status
  uploadStatus: varchar('upload_status', { length: 20 }).notNull().default('pending'),
  hasDuplicates: boolean('has_duplicates').notNull().default(false),
  qualityScore: varchar('quality_score', { length: 10 }), // 0.0-1.0 as string
  
  // Timestamps
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes for photos table
// CREATE INDEX idx_user_hash ON photos(user_id, hash_md5);
// CREATE INDEX idx_user_created ON photos(user_id, created_date);
// CREATE INDEX idx_upload_status ON photos(upload_status);

/**
 * TypeScript types inferred from photos schema
 */
export type Photo = InferSelectModel<typeof photos>;
export type NewPhoto = InferInsertModel<typeof photos>;

/**
 * Photo DTO for API responses
 */
export type PhotoDTO = Omit<Photo, 'hashMd5' | 'hashSha256' | 'hashPerceptual'> & {
  thumbnailUrl: string;
  fileSizeMB: number;
};
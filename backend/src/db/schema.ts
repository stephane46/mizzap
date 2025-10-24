import { pgTable, uuid, varchar, timestamp, boolean, bigint, jsonb } from 'drizzle-orm/pg-core';
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
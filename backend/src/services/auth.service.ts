import { createClient } from '@supabase/supabase-js';
import jwt, { Secret } from 'jsonwebtoken';
import { db } from '../db';
import { mizzapUsers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput, AuthResponse, JWTPayload } from '../types/auth.types';

/**
 * Authentication Service
 * Uses Supabase Auth for authentication, mizzap_users for profile data
 */
export class AuthService {
  private supabase;

  constructor() {
    // Initialize Supabase client with service role key for admin operations
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * Register a new user
   * Uses Supabase Auth to create user, then enriches profile in mizzap_users
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, fullName } = input;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for MVP
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new AppError(409, 'USER_EXISTS', 'User with this email already exists');
      }
      throw new AppError(400, 'AUTH_ERROR', authError.message);
    }

    if (!authData.user) {
      throw new AppError(500, 'AUTH_FAILED', 'Failed to create user');
    }

    // The database trigger handle_new_user() auto-creates the mizzap_users record
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch the created user profile
    const [userProfile] = await db
      .select()
      .from(mizzapUsers)
      .where(eq(mizzapUsers.id, authData.user.id))
      .limit(1);

    if (!userProfile) {
      throw new AppError(500, 'PROFILE_NOT_CREATED', 'User profile was not created');
    }

    // Generate our own JWT token for API access
    const accessToken = this.generateAccessToken({
      userId: authData.user.id,
      email: authData.user.email!,
    });

    return {
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        subscriptionTier: userProfile.subscriptionTier,
      },
      accessToken,
    };
  }

  /**
   * Login user
   * Uses Supabase Auth to validate credentials
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Authenticate with Supabase Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Fetch user profile from mizzap_users
    const [user] = await db
      .select()
      .from(mizzapUsers)
      .where(eq(mizzapUsers.id, data.user.id))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_DISABLED', 'Account has been disabled');
    }

    // Update last login timestamp
    await db
      .update(mizzapUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(mizzapUsers.id, user.id));

    // Generate our own JWT token for API access
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionTier: user.subscriptionTier,
      },
      accessToken,
    };
  }

  /**
   * Get user by ID
   * Used by auth middleware to fetch user details
   */
  async getUserById(userId: string) {
    const [user] = await db
      .select()
      .from(mizzapUsers)
      .where(eq(mizzapUsers.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_DISABLED', 'Account has been disabled');
    }

    return user;
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(payload: JWTPayload): string {
    const secret = config.jwt.secret;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(payload, secret as Secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256',
    } as any); // Type workaround for jsonwebtoken
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    const secret = config.jwt.secret;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    try {
      return jwt.verify(token, secret as Secret) as JWTPayload;
    } catch (error) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
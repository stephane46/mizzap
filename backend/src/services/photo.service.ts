import { createClient } from '@supabase/supabase-js';
import { db } from '../db';
import { photos, NewPhoto, Photo } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import sharp from 'sharp';
import exifr from 'exifr';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

/**
 * Photo Upload Input
 */
export interface PhotoUploadInput {
  file: Express.Multer.File;
  userId: string;
}

/**
 * Photo List Query
 */
export interface PhotoListQuery {
  page?: number;
  limit?: number;
  sortBy?: 'uploadedAt' | 'createdDate' | 'fileName';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Photo Service
 * Handles photo uploads, storage, metadata extraction, and management
 */
export class PhotoService {
  private supabase;
  private bucketName = 'photos';

  constructor() {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase URL and Service Role Key must be configured');
    }
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey // Use service role key for admin operations
    );
  }

  /**
   * Upload photo to Supabase Storage and save metadata to database
   */
  async uploadPhoto(input: PhotoUploadInput): Promise<Photo> {
    const { file, userId } = input;

    try {
      // 1. Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new AppError(400, 'INVALID_FILE_TYPE', 'Only image files are allowed');
      }

      // 2. Calculate hashes for deduplication
      const hashMd5 = crypto.createHash('md5').update(file.buffer).digest('hex');
      const hashSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

      // 3. Check for exact duplicates
      const existingPhoto = await db
        .select()
        .from(photos)
        .where(and(eq(photos.userId, userId), eq(photos.hashMd5, hashMd5)))
        .limit(1);

      if (existingPhoto.length > 0) {
        throw new AppError(409, 'DUPLICATE_PHOTO', 'This photo has already been uploaded');
      }

      // 4. Extract image metadata with Sharp
      const imageMetadata = await sharp(file.buffer).metadata();

      // 5. Extract EXIF data
      let exifData: any = {};
      try {
        exifData = await exifr.parse(file.buffer) || {};
      } catch (error) {
        console.warn('EXIF extraction failed:', error);
      }

      // 6. Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

      // 7. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new AppError(500, 'UPLOAD_FAILED', `Failed to upload photo: ${uploadError.message}`);
      }

      // 8. Generate thumbnails (background job in production)
      await this.generateThumbnails(filePath, file.buffer);

      // 9. Save photo metadata to database
      const newPhoto: NewPhoto = {
        userId,
        fileName: file.originalname,
        filePath: uploadData.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        hashMd5,
        hashSha256,
        width: imageMetadata.width || null,
        height: imageMetadata.height || null,
        createdDate: exifData.DateTimeOriginal || exifData.CreateDate || new Date(),
        locationLatitude: exifData.latitude?.toString() || null,
        locationLongitude: exifData.longitude?.toString() || null,
        cameraModel: exifData.Model || null,
        uploadStatus: 'uploaded',
      };

      const [photo] = await db.insert(photos).values(newPhoto).returning();

      // 10. Update user's storage usage
      await this.updateUserStorage(userId, file.size);

      return photo;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'UPLOAD_ERROR', 'An error occurred during photo upload');
    }
  }

  /**
   * Generate thumbnails for uploaded photo
   */
  private async generateThumbnails(filePath: string, buffer: Buffer): Promise<void> {
    const sizes = [
      { name: 'thumb', width: 200, height: 200 },
      { name: 'preview', width: 400, height: 400 },
      { name: 'web', width: 1200, height: 1200 },
    ];

    for (const size of sizes) {
      try {
        const thumbnail = await sharp(buffer)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailPath = filePath.replace(/\.[^.]+$/, `_${size.name}.jpg`);

        await this.supabase.storage
          .from(this.bucketName)
          .upload(thumbnailPath, thumbnail, {
            contentType: 'image/jpeg',
            cacheControl: '31536000', // 1 year
            upsert: true,
          });
      } catch (error) {
        console.error(`Failed to generate ${size.name} thumbnail:`, error);
      }
    }
  }

  /**
   * Update user's storage usage
   */
  private async updateUserStorage(userId: string, additionalBytes: number): Promise<void> {
    // This will be implemented when we add storage tracking
    // For now, just log
    console.log(`User ${userId} uploaded ${additionalBytes} bytes`);
  }

  /**
   * List user's photos with pagination
   */
  async listPhotos(userId: string, query: PhotoListQuery = {}): Promise<{
    photos: Photo[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const sortBy = query.sortBy || 'uploadedAt';
    const sortOrder = query.sortOrder || 'desc';

    // Get total count
    const totalResult = await db
      .select({ count: photos.id })
      .from(photos)
      .where(eq(photos.userId, userId));

    const total = totalResult.length;

    // Get paginated photos
    const userPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, userId))
      .orderBy(sortOrder === 'desc' ? desc(photos[sortBy]) : photos[sortBy])
      .limit(limit)
      .offset(offset);

    return {
      photos: userPhotos,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + userPhotos.length < total,
      },
    };
  }

  /**
   * Get photo by ID
   */
  async getPhotoById(photoId: string, userId: string): Promise<Photo> {
    const [photo] = await db
      .select()
      .from(photos)
      .where(and(eq(photos.id, photoId), eq(photos.userId, userId)))
      .limit(1);

    if (!photo) {
      throw new AppError(404, 'PHOTO_NOT_FOUND', 'Photo not found');
    }

    return photo;
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string, userId: string): Promise<void> {
    // 1. Get photo details
    const photo = await this.getPhotoById(photoId, userId);

    // 2. Delete from Supabase Storage
    const { error: deleteError } = await this.supabase.storage
      .from(this.bucketName)
      .remove([photo.filePath]);

    if (deleteError) {
      console.error('Failed to delete from storage:', deleteError);
    }

    // 3. Delete thumbnails
    const thumbnailPaths = [
      photo.filePath.replace(/\.[^.]+$/, '_thumb.jpg'),
      photo.filePath.replace(/\.[^.]+$/, '_preview.jpg'),
      photo.filePath.replace(/\.[^.]+$/, '_web.jpg'),
    ];

    await this.supabase.storage.from(this.bucketName).remove(thumbnailPaths);

    // 4. Delete from database
    await db.delete(photos).where(and(eq(photos.id, photoId), eq(photos.userId, userId)));

    // 5. Update user's storage usage
    await this.updateUserStorage(userId, -photo.fileSize);
  }

  /**
   * Get photo thumbnail URL
   */
  async getThumbnailUrl(photoId: string, userId: string, size: 'thumb' | 'preview' | 'web' = 'thumb'): Promise<string> {
    const photo = await this.getPhotoById(photoId, userId);
    const thumbnailPath = photo.filePath.replace(/\.[^.]+$/, `_${size}.jpg`);

    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(thumbnailPath);

    return data.publicUrl;
  }
}

export const photoService = new PhotoService();
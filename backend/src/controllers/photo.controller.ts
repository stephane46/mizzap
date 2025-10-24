import { Request, Response, NextFunction } from 'express';
import { photoService } from '../services/photo.service';
import { AppError } from '../middleware/errorHandler';

/**
 * Photo Controller
 * Handles HTTP requests for photo endpoints
 */
export class PhotoController {
  /**
   * Upload a photo
   * POST /api/v1/photos/upload
   */
  async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if file was uploaded
      if (!req.file) {
        throw new AppError(400, 'NO_FILE', 'No file was uploaded');
      }

      // Get user ID from auth middleware
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      // Upload photo
      const photo = await photoService.uploadPhoto({
        file: req.file,
        userId,
      });

      res.status(201).json({
        success: true,
        data: {
          id: photo.id,
          fileName: photo.fileName,
          fileSize: photo.fileSize,
          width: photo.width,
          height: photo.height,
          uploadedAt: photo.uploadedAt,
          thumbnailUrl: `/api/v1/photos/${photo.id}/thumbnail`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List user's photos
   * GET /api/v1/photos
   */
  async listPhotos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = (req.query.sortBy as 'uploadedAt' | 'createdDate' | 'fileName') || 'uploadedAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      // Get photos
      const result = await photoService.listPhotos(userId, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // Format response
      const photosWithThumbnails = result.photos.map((photo) => ({
        id: photo.id,
        fileName: photo.fileName,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        width: photo.width,
        height: photo.height,
        createdDate: photo.createdDate,
        uploadedAt: photo.uploadedAt,
        hasDuplicates: photo.hasDuplicates,
        thumbnailUrl: `/api/v1/photos/${photo.id}/thumbnail`,
      }));

      res.status(200).json({
        success: true,
        data: photosWithThumbnails,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get photo by ID
   * GET /api/v1/photos/:id
   */
  async getPhotoById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const photoId = req.params.id;

      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const photo = await photoService.getPhotoById(photoId, userId);

      res.status(200).json({
        success: true,
        data: {
          id: photo.id,
          fileName: photo.fileName,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          width: photo.width,
          height: photo.height,
          createdDate: photo.createdDate,
          locationLatitude: photo.locationLatitude,
          locationLongitude: photo.locationLongitude,
          cameraModel: photo.cameraModel,
          uploadedAt: photo.uploadedAt,
          hasDuplicates: photo.hasDuplicates,
          thumbnailUrl: `/api/v1/photos/${photo.id}/thumbnail`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete photo
   * DELETE /api/v1/photos/:id
   */
  async deletePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const photoId = req.params.id;

      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      await photoService.deletePhoto(photoId, userId);

      res.status(200).json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get photo thumbnail
   * GET /api/v1/photos/:id/thumbnail
   */
  async getThumbnail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const photoId = req.params.id;
      const size = (req.query.size as 'thumb' | 'preview' | 'web') || 'thumb';

      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const thumbnailUrl = await photoService.getThumbnailUrl(photoId, userId, size);

      // Redirect to Supabase Storage URL
      res.redirect(thumbnailUrl);
    } catch (error) {
      next(error);
    }
  }
}

export const photoController = new PhotoController();
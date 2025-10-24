import { Router } from 'express';
import multer from 'multer';
import { photoController } from '../controllers/photo.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Multer configuration for file uploads
 * Store files in memory as Buffer for processing
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

/**
 * @route   POST /api/v1/photos/upload
 * @desc    Upload a photo
 * @access  Private (requires authentication)
 */
router.post(
  '/upload',
  authenticate,
  upload.single('photo'),
  (req, res, next) => photoController.uploadPhoto(req, res, next)
);

/**
 * @route   GET /api/v1/photos
 * @desc    List user's photos with pagination
 * @access  Private
 */
router.get('/', authenticate, (req, res, next) => photoController.listPhotos(req, res, next));

/**
 * @route   GET /api/v1/photos/:id
 * @desc    Get photo by ID
 * @access  Private
 */
router.get('/:id', authenticate, (req, res, next) => photoController.getPhotoById(req, res, next));

/**
 * @route   GET /api/v1/photos/:id/thumbnail
 * @desc    Get photo thumbnail (redirects to Supabase Storage)
 * @access  Private
 */
router.get('/:id/thumbnail', authenticate, (req, res, next) => photoController.getThumbnail(req, res, next));

/**
 * @route   DELETE /api/v1/photos/:id
 * @desc    Delete a photo
 * @access  Private
 */
router.delete('/:id', authenticate, (req, res, next) => photoController.deletePhoto(req, res, next));

export default router;
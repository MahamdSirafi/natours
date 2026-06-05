import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getAllReviews,
  getReview,
  setTourAndUserIds,
  updateReview,
} from '../controllers/reviewController.js';
import { protect, restrictTo } from '../controllers/authController.js';
import { isBooked } from '../controllers/bookingController.js';

const router = Router({ mergeParams: true });
router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourAndUserIds, isBooked, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);
export default router;

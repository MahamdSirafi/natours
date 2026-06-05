import express from 'express';
import { protect, restrictTo } from '../controllers/authController.js';
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBooking,
  getCheckoutSession,
  getMyBookings,
  updateBooking,
} from '../controllers/bookingController.js';
import { setTourAndUserIds } from '../controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/checkout-session/:tourId', restrictTo('user'), getCheckoutSession);

router.get('/myBookings', getMyBookings);

router.use(restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllBookings).post(setTourAndUserIds, createBooking);

router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

export default router;

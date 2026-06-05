import { Router } from 'express';
import { protect, restrictTo } from '../controllers/authController.js';
import {
  getTour,
  deleteTour,
  createTour,
  updateTour,
  getAllTours,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getToursDistances,
  uploadTourImages,
  resizeTourImages,
} from '../controllers/tourController.js';
import reviewRouter from './reviewRoutes.js';
import bookingRouter from './bookingRoutes.js';

const router = Router();
/*
NOTE  when we use middleware route we send with him the direct path and inside
NOTE  the route we don't need to  write the url another time cause in father
NOTE  app we use the route and send the url with and inside the route we deal with him like a father
*/
router.use('/:tourId/reviews/', reviewRouter);

router.use('/:tourId/bookings/', bookingRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);

router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getToursDistances);

router
  .route('/')
  .get(getAllTours)
  .post(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    createTour
  );

router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

export default router;

import { Router } from 'express';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updateMyPassword,
  restrictTo,
  logout,
  isTokenValid,
} from '../controllers/authController.js';
import {
  getAllUsers,
  updateMe,
  deleteMe,
  getUser,
  deleteUser,
  updateUser,
  getMe,
  uploadUserPhoto,
  resizeUserImage,
} from '../controllers/userController.js';
import bookingRouter from './bookingRoutes.js';

const router = Router();

router.use('/:userId/bookings/', bookingRouter);

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').get(isTokenValid).patch(resetPassword);

//Protect all routes after this middleware
router.use(protect);
router.route('/me').get(getMe, getUser);
router.route('/updateMyPassword').patch(updateMyPassword);
router.route('/updateMe').patch(uploadUserPhoto, resizeUserImage, updateMe);
router.route('/deleteMe').delete(deleteMe);

//All routes after this middleware are only for admin
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers);
router.route('/:id').get(getUser).delete(deleteUser).patch(updateUser);

export default router;

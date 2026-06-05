import crypto from 'crypto';
import Tour from '../models/tourModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import User from '../models/userModel.js';
import Booking from '../models/bookingModel.js';
import APIFeatures from '../utils/apiFeatures.js';

export const getOverview = catchAsync(async (req, res, next) => {
  const filter = {};

  const feature = new APIFeatures(Tour.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const docs = await feature.query;

  const tours = await Tour.find({
    _id: { $in: docs.map((docss) => docss.id) },
  });
  res.status(200).render('overview', { title: 'All tours', tours });
});

export const getTour = catchAsync(async (req, res, next) => {
  //virtual fields from another doc do not show up without populate (reviews)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) return next(new AppError(404, 'There is no tour with that name'));
  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});

export const getMostCheapestTours = catchAsync(async (req, res, next) => {
  const year = 2021;
  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTours: -1 } },
  ]);

  res.status(200).render('overview', { title: 'All tours', tours: plan });
});

export const getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
    url: ` ${req.protocol}://${req.get('host')}/forgotPassword`,
  });
});

export const getTourForm = catchAsync(async (req, res) => {
  res.status(200).render('new-tour', { title: 'Create new tour' });
});

export const getSignupForm = catchAsync(async (req, res) => {
  res.status(200).render('signup', { title: 'Create your account' });
});

export const getMe = catchAsync(async (req, res, next) => {
  res.status(200).render('account', { title: 'My Account' });
});

export const getForgotPasswordForm = catchAsync(async (req, res, next) => {
  res.status(200).render('forgotPassword', { title: 'Forgot Password' });
});

export const getResetPasswordForm = catchAsync(async (req, res, next) => {
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError(404, 'Invalid url, Please go to the home page'));
  }
  res.status(200).render('resetPassword', {
    title: 'Reset Password',
    token: req.params.token,
  });
});

export const getMyBookings = catchAsync(async (req, res, next) => {
  //1) Get user's bookings
  const booking = await Booking.find({ user: req.user.id });

  //2) Get the tour that the user had booked
  const tourIds = booking.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render('overview', { title: 'My tours', tours });
});

export const alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. If your booking does't show up here immediately, please come back later.";
  next();
};

export const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
  ]);
  res.status(200).render('stats', {
    title: 'Tour Stats',
    stats,
  });
});

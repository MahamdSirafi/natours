import multer from 'multer';
import sharp from 'sharp';
import Tour from '../models/tourModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory.js';

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError(400, 'Not an image! Please upload only images.'), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
]);
export const resizeTourImages = catchAsync(async (req, res, next) => {
  if (req.body.startDates) {
    req.body.startDates = JSON.parse(req.body.startDates);
  }
  if (req.body.locations) {
    req.body.locations = JSON.parse(req.body.locations);
  }
  if (req.body.startLocation) {
    req.body.startLocation = JSON.parse(req.body.startLocation);
  }

  const tour = await Tour.findOne().sort({ createdAt: 1 });

  req.body.guides = tour.guides;
  if (
    !req.files.imageCover ||
    !req.files.image1 ||
    !req.files.image2 ||
    !req.files.image3
  )
    return next();

  req.body.images = [
    `tour-${Date.now()}-1.jpg`,
    `tour-${Date.now()}-2.jpg`,
    `tour-${Date.now()}-3.jpg`,
  ];
  req.body.imageCover = `tour-${Date.now()}-cover.jpg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  await sharp(req.files.image1[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.images[0]}`);

  await sharp(req.files.image2[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.images[1]}`);

  await sharp(req.files.image3[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.images[2]}`);

  //we are using map to make the data inside the promise.all an array of promises because forEach does not
  // await Promise.all(
  //   req.files.images.map(async (e, i) => {
  //     req.body.images.push(`tour-${req.params.id}-${Date.now()}-${i + 1}.jpg`);
  //     await sharp(e.buffer)
  //       .resize(2000, 1333)
  //       .toFormat('jpg')
  //       .jpeg({ quality: 90 })
  //       .toFile(`public/img/tours/${req.body.images[i]}`);
  //   })
  // );

  next();
});

//NOTE these funcs do not have to worry about any error cause they just do what they made for it
export const aliasTopTours = async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,difficulty,summary';
  next();
};

export const getAllTours = getAll(Tour);

export const getTour = getOne(Tour, { path: 'reviews' });

export const createTour = createOne(Tour);

export const updateTour = updateOne(Tour);

export const deleteTour = deleteOne(Tour);

//NOTE stats
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
  res.status(200).send({
    status: 'success',
    data: {
      stats,
    },
  });
});

export const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
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
  res.status(200).send({
    status: 'success',
    data: {
      plan,
    },
  });
});

export const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //find the radius comparing with the earth sphere
  //process anything was sent with request except the valueType example : lat,lng
  if (!lat || !lng) {
    return next(
      new AppError(
        400,
        'Please provide latitude and longitude in the format lat,lng'
      )
    );
  }
  //Find tours whose starting location is 200{distance(radius)} miles {unit} or less from my location{center}
  //And the geoJson make a circle have a radius and it's center is myLocation(center)and each point in this circle is counted
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng * 1, lat * 1], radius] },
    },
  });
  res
    .status(200)
    .json({ status: 'success', result: tours.length, data: { data: tours } });
});

export const getToursDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    return next(
      new AppError(
        400,
        'Please provide latitude and longitude in the format lat,lng'
      )
    );
  }
  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'dist.distance',
        distanceMultiplier: multiplier,
        // query: { difficulty: 'difficult' },
        includeLocs: 'dist.location',
        spherical: true,
      },
    },
    { $project: { name: 1, dist: 1 } },
  ]);
  res
    .status(200)
    .json({ status: 'success', result: tours.length, data: { data: tours } });
});

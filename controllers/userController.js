import multer from 'multer';
import sharp from 'sharp';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { deleteOne, getAll, getOne, updateOne } from './handlerFactory.js';

const multerStorage = multer.memoryStorage();
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     const fileName = `user-${req.user.id}-${Date.now()}.${ext}`;
//     cb(null, fileName);
//   },
// });

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError(400, 'Not an image! Please upload only images.'), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadUserPhoto = upload.single('photo');

export const resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
export const updateMe = catchAsync(async (req, res, next) => {
  //If the user use update me should not send pass cause this route for normal work like update name,email... not auth
  //and if the front end developer thought this route for update password
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        400,
        'This route is not for updates password. Please use /updateMyPassword to update password'
      )
    );
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    { new: true, runValidators: true }
    //run validator for normal like minlength or enum but not required
  );
  res.status(200).json({ status: 'success', data: { user } });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getAllUsers = getAll(User);
export const getUser = getOne(User);
//Do not update password with this
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);

export const getGuides = catchAsync(async (req, res, next) => {
  const guides = await User.find({
    role: { $in: ['guide', 'lead-guide'] },
  }).select('name email role photo');
  res.status(200).json({ status: 'success', data: { data: guides } });
});

export const createGuide = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;
  if (!['guide', 'lead-guide'].includes(role)) {
    return next(new AppError(400, 'Role must be guide or lead-guide'));
  }
  const newGuide = await User.create({ name, email, password, passwordConfirm, role });
  newGuide.password = undefined;
  res.status(201).json({ status: 'success', data: { data: newGuide } });
});

export const updateGuide = catchAsync(async (req, res, next) => {
  const { name, email, role } = req.body;
  if (role && !['guide', 'lead-guide'].includes(role)) {
    return next(new AppError(400, 'Role must be guide or lead-guide'));
  }
  const guide = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role },
    { new: true, runValidators: true }
  ).select('name email role photo');
  if (!guide) return next(new AppError(404, 'No guide found with that ID'));
  res.status(200).json({ status: 'success', data: { data: guide } });
});

export const deleteGuide = catchAsync(async (req, res, next) => {
  const guide = await User.findByIdAndDelete(req.params.id);
  if (!guide) return next(new AppError(404, 'No guide found with that ID'));
  res.status(204).json({ status: 'success', data: null });
});

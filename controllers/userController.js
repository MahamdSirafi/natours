import multer from 'multer';
import sharp from 'sharp';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
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

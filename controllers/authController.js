import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import Email from '../utils/email.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  //remove password from output
  user.password = undefined;
  res.status(statusCode).send({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
export const signup = catchAsync(async (req, res, next) => {
  if (req.file) req.body.photo = req.file.filename;

  const newUser = await User.create(req.body);
  await new Email(
    newUser,
    `${req.protocol}://${req.get('host')}/me`
  ).sendWelcome();
  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  //Check if  the email and password  exist
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError(400, 'Please provide password and email'));
  }
  //check if the user exist and the password correct
  const user = await User.findOne({ email }).select(
    '+password +logInTimes +bannedForHour'
  );
  if (
    !user ||
    !(await user.correctPassword(password)) ||
    user.bannedForHourFun()
  ) {
    if (user && !user.bannedForHourFun()) {
      if (!user.logInTimes) user.logInTimes = 0;
      user.logInTimes += 1;
      await user.save({ validateBeforeSave: false });
    }
    const message =
      user && user.bannedForHourFun()
        ? `The limited number of login attempts has been exceeded,Try again after ${new Date(
            user.bannedForHour - Date.now()
          ).getMinutes()} Minutes`
        : 'Incorrect password or email';
    return next(new AppError(401, message));
  }
  if (user.logInTimes >= 0 || user.bannedForHour) {
    user.logInTimes = undefined;
    user.bannedForHour = undefined;
    await user.save({ validateBeforeSave: false });
  }
  createSendToken(user, 200, res);
});

export const logout = async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const protect = catchAsync(async (req, res, next) => {
  // Getting a token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //1) If the token not exist either the authorization found or not
  if (!token) {
    return next(
      new AppError(401, 'You are not logged in, please log in to get access.')
    );
  }
  //2) Verification token
  //use promisify because we are in async func and for await until the verification to be completed to return the result
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

  //3) Check if the user of this jwt still exist
  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    return next(
      new AppError(401, 'The user belonging to this token does no longer exist')
    );
  }
  //4) Check if the user changed the password
  if (currentUser.isPasswordChanged(decode.iat)) {
    return next(
      new AppError(
        401,
        'User recently changed the password!, please login again.'
      )
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

export const isLoggedIn = async (req, res, next) => {
  // Getting a token and check of it's there
  try {
    if (!req.cookies.jwt) return next();
    //2) Verification token
    //use promisify because we are in async func and for await until the verification to be completed to return the result
    const decode = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET_KEY
    );

    //3) Check if the user of this jwt still exist
    const currentUser = await User.findById(decode.id);
    if (!currentUser) {
      return next();
    }
    //4) Check if the user changed the password
    if (currentUser.isPasswordChanged(decode.iat)) {
      return next();
    }
    res.locals.user = currentUser;
    next();
  } catch (err) {
    return next();
  }
};

//for permission
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action ')
      );
    }
    next();
  };

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  // 1) Search for the user
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError(404, 'There is no user with that email'));
  }
  // 2) Create reset token
  const resetToken = user.createPasswordResetToken();

  //3) Save the user with resetToken to the database to modify it
  await user.save({ validateBeforeSave: false });
  //Reset URL
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/resetPassword/${resetToken}`;
  // 4) Send the email
  try {
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    //If ann error happen get rid of reset info from database cause the message was not sent
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        500,
        'There was an error sending the email. Try again later!'
      )
    );
  }
});

//Check if the reset token valid
export const isTokenValid = catchAsync(async (req, res, next) => {
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError(404, 'Token is invalid or expired'));

  res.status(200).json({ status: 'success' });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  //1) encode the token
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //2) Find user with that resetToken and does not expire
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError(400, 'Token is invalid or expired'));
  }
  //3) Save the new data
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  const home = `${req.protocol}://${req.get('host')}/`;
  await new Email(user, home).sendResetMessage();

  createSendToken(user, 200, res);
});

//update logged user password
export const updateMyPassword = catchAsync(async (req, res, next) => {
  const { passwordCurrent, password, passwordConfirm } = req.body;
  // 1) get the logged in user
  const user = await User.findById(req.user.id).select('+password');
  // 2)check if the passwordConfirm is correct
  if (!(await user.correctPassword(passwordCurrent))) {
    return next(new AppError(401, 'Your current password is wrong'));
  }
  //3) Change the password to the new one
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  const me = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, me).sendResetMessage();
  //Logging in the user
  createSendToken(user, 200, res);
});

import mongoose from 'mongoose';
import validator from 'validator';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

const { Schema, model } = mongoose;
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
      type: String,
      enum: ['admin', 'guide', 'lead-guide', 'user'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'the password must have at least 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    logInTimes: {
      type: Number,
      select: false,
    },
    bannedForHour: { type: Date, select: false },
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);
userSchema.pre('save', function (next) {
  //if the password not changed or newUser made end the process
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
//Document middleware
userSchema.pre('save', async function (next) {
  //if the password not changed end the process
  if (!this.isModified('password')) return next();

  //crypt the password
  this.password = await bcryptjs.hash(this.password, 12);

  //we are not need confirm password filed
  this.passwordConfirm = undefined;
  next();
});
//The limited number of login times exceeded
userSchema.pre('save', function (next) {
  if (this.logInTimes !== 10) return next();
  this.bannedForHour = Date.now() + 60 * 60 * 1000;
  this.logInTimes = undefined;
  next();
});
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//we did this operation in the model to apply the concept of fat model && fit controller
//for matching the password with the encrypted one
userSchema.methods.correctPassword = async function (candidatePassword) {
  //candidate password means the password with the body
  return bcryptjs.compare(candidatePassword, this.password);
};

//know if the password changed
userSchema.methods.isPasswordChanged = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changeTimestamp > JWTTimestamp;
  }
  return false;
};
//Create reset Token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
userSchema.methods.bannedForHourFun = function () {
  if (!this.bannedForHour) return false;
  return this.bannedForHour > Date.now();
};
const User = model('User', userSchema);

export default User;

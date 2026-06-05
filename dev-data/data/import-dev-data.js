import { config } from 'dotenv';
import mongoose from 'mongoose';
import tours from './tours.json' with { type: 'json' };
import users from './users.json' with { type: 'json' };
import reviews from './reviews.json' with { type: 'json' };
import Tour from '../../models/tourModel.js';
import User from '../../models/userModel.js';
import Review from '../../models/reviewModel.js';

config();
const DB =
  process.env.NODE_ENV === 'production'
    ? process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD)
    : process.env.DB;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successes'));

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users);
    await Review.create(reviews);
    console.log('imported');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

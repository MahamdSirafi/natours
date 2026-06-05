import mongoose from 'mongoose';
import Tour from './tourModel.js';

const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
      trim: true,
    },
    rating: { type: Number, max: 5, min: 1 },
    createdAt: { type: Date, default: Date.now() },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: 'tour', select: 'name ' }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        numRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    const body = {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].numRatings,
    };
    await Tour.findByIdAndUpdate(tourId, body);
  } else {
    const body = {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    };
    await Tour.findByIdAndUpdate(tourId, body);
  }
};
reviewSchema.post('save', function () {
  //update the ratingsAvg on tour each time a review created
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/findOneAnd/, async function (next) {
  //Store the doc before it updates or deletes using findOne on the query {(find on find)} and it returns the doc that is processing
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/findOneAnd/, function () {
  //I can not use this.findOne() here because it returns null when i delete doc but it works on update
  this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = model('Review', reviewSchema);

export default Review;

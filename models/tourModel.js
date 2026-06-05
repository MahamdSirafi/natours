import mongoose from 'mongoose';
import slugify from 'slugify';

const { Schema, model } = mongoose;
//Document
const tourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minLength: [10, 'A tour name must have at least 10 characters'],
      maxLength: [40, 'A tour name must have at most 40 characters'],
      // validate: [validator.isAlpha, 'A tour name must contain only letters '],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy,medium,difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A tour rating must be above 1'],
      max: [5, 'A tour rating must be below 5'],
      set: (value) => Math.round(value * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //custom validator
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'The priceDiscount {VALUE} must be below the price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(), //default does not have a required
    },
    startDates: [Date],
    startLocation: {
      //GeoJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        description: String,
        day: Number,
      },
    ],
    //[{type:id,ref:'User}] mean the type of elements inside the array otherwise mean embedded data
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    secretTour: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// Virtual because i can get  it from felid in the schema (duration in days)/7=>week
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//Document Middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true, trim: true });
  next();
});

//Embedding guides
// tourSchema.pre('save', async function (next) {
//   const guides = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guides);
//   next();
// });

//Query Middleware
tourSchema.pre(/^find/, function (next) {
  //only the normal tours that have secretTour===false
  this.find({ secretTour: { $ne: true } });
  next();
});
// populate Users
tourSchema.pre(/^find/, async function (next) {
  //only the normal tours that have secretTour===false
  this.populate({ path: 'guides', select: '-passwordChangedAt' });
  next();
});

//aggregation MiddleWare
// tourSchema.pre('aggregate', function (next) {
//   //use unshift for adding in the start of the pipeline's Array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

//Collection
const Tour = model('Tour', tourSchema);
export default Tour;

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const bookingSchema = new Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
    },
    createdAt: { type: Date, default: Date.now() },
    price: {
      type: Number,
      required: [true, 'Booking must have a price'],
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);
bookingSchema.pre(/^find/, function (next) {
  this.populate({ path: 'tour', select: 'name ' }).populate('user');
  next();
});
const Booking = model('Booking', bookingSchema);

export default Booking;

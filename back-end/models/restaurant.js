const mongoose = require("mongoose");
const random = require("mongoose-simple-random");

const Schema = mongoose.Schema;

const restaurantSchema = new Schema({
  icon: String,
  restaurantName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    five: {
      type: Number,
      default: 0,
    },
    four: {
      type: Number,
      default: 0,
    },
    three: {
      type: Number,
      default: 0,
    },
    two: {
      type: Number,
      default: 0,
    },
    one: {
      type: Number,
      default: 0,
    },
  },
  favourites: {
    type: Number,
    default: 0,
  },
  location: String,
  gallery: [
    {
      type: String,
      required: true,
    },
  ],
  tags: [
    {
      type: String,
      required: true,
    },
  ],
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
      required: true,
    },
  ],
});

restaurantSchema.plugin(random);

restaurantSchema.methods.updateRating = function (rating) {
  console.log(rating);
  switch (rating) {
    case 5:
      this.reviewCount.five++;
      break;
    case 4:
      this.reviewCount.four++;
      break;
    case 3:
      this.reviewCount.three++;
      break;
    case 2:
      this.reviewCount.two++;
      break;
    case 1:
      this.reviewCount.one++;
      break;
  }
  const five = this.reviewCount.five;
  const four = this.reviewCount.four;
  const three = this.reviewCount.three;
  const two = this.reviewCount.two;
  const one = this.reviewCount.one;
  const count = five + four + three + two + one;
  const rated = (5 * five + 4 * four + 3 * three + 2 * two + 1 * one) / count;
  const newRating = rated.toFixed(2);
  this.rating = newRating;
  return this.save();
};

restaurantSchema.methods.updateFavourites = function (value) {
  this.favourites += value;
  this.save();
};

module.exports = mongoose.model("Restaurant", restaurantSchema);

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  icon: String,
  points: {
    type: Number,
    required: true,
    default: 0,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
      required: true,
    },
  ],
  favourites: [
    {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
  ],
  dateJoined: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);

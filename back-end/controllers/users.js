require("dotenv").config();

const { validationResult } = require("express-validator");

const Restaurant = require("../models/restaurant");
const Review = require("../models/review");
const User = require("../models/user");

exports.getUsers = async (req, res, next) => {
  const currentpage = req.query.page || 1;
  const itemsperpage = 10;
  const totalUsers = await User.countDocuments();
  const thisUser = await User.findById(req.userId, "username points");
  try {
    const usersArr = await User.find({ _id: { $ne: req.userId } })
      .select("username points")
      .skip((Number(currentpage) - 1) * Number(itemsperpage))
      .limit(Number(itemsperpage))
      .sort("-points")
      .lean();
    // adding ranking
    const users = usersArr.map((user, index) => {
      return {
        position: index + 1,
        username: user.username,
        points: user.points,
      };
    });
    res
      .status(200)
      .json({ thisUser: thisUser, users: users, totalUsers: totalUsers });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.userDetails = async (req, res, next) => {
  const userId = req.params.userId;
  // sees if this is the user's profile
  let isUser = false;
  if (userId == req.userId.toString()) {
    isUser = true;
  }
  try {
    // gets the user
    const userDoc = await User.findById(userId, "username points dateJoined");
    // throws error if there is no user with this id
    if (!userDoc) {
      const error = new Error("No user with such id found.");
      error.statusCode = 404;
      throw error;
    }
    // count how many reviews the user made
    const reviewsCount = await Review.countDocuments({ userId: userId });
    // restructure the object
    const user = {
      username: userDoc.username,
      points: userDoc.points,
      dateJoined: userDoc.dateJoined,
      reviewsCount: reviewsCount,
    };
    res.status(200).json({ user: user, isUser: isUser });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.userOverview = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId, "favourites reviews", {
      reviews: { $slice: 3 },
    })
      .populate({
        path: "favourites",
        select: "-_id restaurantName rating tags",
      })
      .populate({
        path: "reviews",
        select: "-_id restaurantId rating comment",
        populate: {
          path: "restaurantId",
          select: "-_id restaurantName",
        },
      });
    // select a random user favourite
    const max = user.favourites.length - 1;
    const randomFavIndex = Math.random() * (max - 0) + 0;
    const featuredFav = user.favourites[randomFavIndex];
    // restructuring reviews
    const reviews = user.reviews.map((review) => {
      return {
        restaurantName: review.restaurantId.restaurantName,
        rating: review.rating,
        comment: review.comment,
      };
    });

    res.status(200).json({ featuredFavourite: featuredFav, reviews: reviews });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.userFavourites = async (req, res, next) => {
  const userId = req.params.userId;
  // sees if this is the user's profile
  let isUser = false;
  if (userId == req.userId.toString()) {
    isUser = true;
  }
  try {
    const user = await User.findById(userId, "favourites").populate({
      path: "favourites",
      select: "-_id restaurantName tags rating favourites",
    });

    res.status(200).json({ favourites: user.favourites, isUser: isUser });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.userReviews = async (req, res, next) => {
  const userId = req.params.userId;
  // sees if this is the user's profile
  let isUser = false;
  if (userId == req.userId.toString()) {
    isUser = true;
  }
  //
  const currentpage = req.query.page || 1;
  const itemsperpage = 5;
  // get total reviews
  const totalReviews = await Review.countDocuments({
    userId: req.userId,
  });
  try {
    // find all reviews on the restaurant
    // populate the userId to get username
    // lean since we wont modify anything
    const reviewArray = await Review.find({
      userId: req.params.userId,
    })
      .select("userId rating comment postedAt")
      .skip((Number(currentpage) - 1) * Number(itemsperpage))
      .limit(Number(itemsperpage))
      .populate("userId", "username")
      .sort("-rating")
      .lean();
    // makes it look cleaner
    const reviews = reviewArray.map((review) => {
      return {
        user: review.userId.username,
        datePosted: review.postedAt,
        rating: review.rating,
        likes: review.likes,
        comment: review.comment,
      };
    });
    res.status(200).json({
      message: "fetched reviews successfuly",
      rewiews: reviews,
      totalReviews: totalReviews,
      isUser: isUser,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.terminateUser = async (req, res, next) => {
//   const userId = req.params.userId;
//   // sees if this is the user's profile
//   let isUser = false;
//   if (userId == req.userId.toString()) {
//     isUser = true;
//   }
//   try {
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

require("dotenv").config();

const { validationResult } = require("express-validator");

const Restaurant = require("../models/restaurant");
const Review = require("../models/review");
const User = require("../models/user");
// fore test only, no validation
exports.createRestaurant = async (req, res, next) => {
  try {
    // give a name to the restaurant, and the rest will be set by default
    const restaurant = new Restaurant({
      restaurantName: req.body.restaurantName,
      tags: req.body.tags,
      location: req.body.location,
    });
    // add to database
    const result = await restaurant.save();
    res.status(201).json({ message: "created restaurant.", result: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getRestaurants = async (req, res, next) => {
  try {
    // get settings
    const tagFilters = req.body.tagFilters || [];
    const searchMode = req.body.searchMode;
    // get restaurant
    let restaurants;
    switch (searchMode) {
      case "hidden gem":
        gemRandom = () => {
          return new Promise((resolve, reject) => {
            Restaurant.findRandom(
              {
                tags: { $nin: tagFilters },
                $and: [{ reviewCount: { $lt: 10 } }, { rating: { $gt: 4 } }],
              },
              {
                icon: 1,
                restaurantName: 1,
                tags: 1,
                rating: 1,
                reviewCount: 1,
              },
              { limit: 5 },
              (err, result) => {
                if (!err) {
                  resolve(result);
                }
              }
            );
          });
        };
        restaurants = await gemRandom();
        break;
      default:
        defaultRandom = () => {
          return new Promise((resolve, reject) => {
            Restaurant.findRandom(
              { tags: { $nin: tagFilters } },
              {
                icon: 1,
                restaurantName: 1,
                tags: 1,
                rating: 1,
                reviewCount: 1,
              },
              { limit: 5 },
              (err, result) => {
                if (!err) {
                  resolve(result);
                }
              }
            );
          });
        };
        restaurants = await defaultRandom();
        break;
    }
    // success
    res.status(200).json({ message: "recommended", restaurants: restaurants });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getDetails = async (req, res, next) => {
  try {
    // get restaurant\
    const restaurantDoc = await Restaurant.findById(
      req.params.restaurantId,
      "restaurantName rating favourites reviewCount tags location"
    ).lean();
    if (!restaurantDoc) {
      const error = new Error("No restaurant with such id found.");
      error.statusCode = 404;
      throw error;
    }
    // sum review
    let sum = 0;
    for (key in restaurantDoc.reviewCount) {
      sum += restaurantDoc.reviewCount[key];
    }
    // restructure purely for looks
    const restaurant = {
      restaurantName: restaurantDoc.restaurantName,
      rating: restaurantDoc.rating,
      favourites: restaurantDoc.favourites,
      reviewCount: sum,
      tags: restaurantDoc.tags,
      location: restaurantDoc.location,
    };
    // here's the data you need doc
    res.status(200).json(restaurant);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.getGallery = async (req, res, next) => {
//   try {
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

// exports.getRatings = async (req, res, next) => {
//   try {
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

exports.getReviews = async (req, res, next) => {
  // gets current page and items per page from query
  const currentpage = req.query.page || 1;
  const itemsperpage = 5;
  // get total reviews
  const totalReviews = await Review.countDocuments({
    restaurantId: req.params.restaurantId,
  });
  try {
    // find all reviews on the restaurant
    // populate the userId to get username
    // lean since we wont modify anything
    const reviewArray = await Review.find({
      restaurantId: req.params.restaurantId,
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
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postReview = async (req, res, next) => {
  // the comments are just here to seperate the blocks tbh
  const userId = req.userId;
  const restaurantId = req.params.restaurantId;
  const comment = req.body.comment || "";
  const rating = req.body.rating;
  // create date
  const postedAt = new Date();
  // creates the new review
  const review = new Review({
    restaurantId: restaurantId,
    userId: userId,
    postedAt: postedAt,
    rating: rating,
    comment: comment,
  });
  try {
    // checks if user enter valid input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // check if the user has already left a review on a restaurant
    const reviewed = await Review.exists({
      userId: userId,
      restaurantId: restaurantId,
    });
    if (reviewed) {
      const error = new Error("User has already reviewed restaurant.");
      error.statusCode = 403;
      throw error;
    }
    // gets user and restaurant to update their respective reviews array
    const user = await User.findById(userId, "reviews points");
    const restaurant = await Restaurant.findById(
      restaurantId,
      "reviews reviewCount rating"
    );
    // pushes result(objectId) into the respective reviews array
    user.reviews.push(review);
    user.points += 10;
    restaurant.reviews.push(review);
    // save to database
    await review.save();
    await user.save();
    await restaurant.save();
    await restaurant.updateRating(rating);
    // success!
    res.status(201).json({
      message: "review posted.",
      reviewId: review._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.likeReview = async (req, res, next) => {
//   try {
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

// exports.updateReview = async (req, res, next) => {
//   try {
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

// exports.deleteReview = async (req, res, next) => {
//   try {
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

exports.favouriteRestaurant = async (req, res, next) => {
  // get ids
  const restaurantId = req.params.restaurantId;
  const userId = req.userId;
  // find restaurant and user
  const restaurant = await Restaurant.findById(restaurantId, "favourites");
  const user = await User.findById(userId, "favourites points");
  const favLength = user.favourites.length();
  try {
    if (!restaurant) {
      const error = new Error("No such restaurant with specified id exists.");
      error.statusCode = 404;
      throw error;
    }
    // can only favourite 5 restaurants
    if (favLength === 5) {
      const error = new Error("Can only favourite 5 restaurants.");
      error.statusCode = 403;
      throw error;
    }
    // either favourite or unfavourite restaurant
    const isReviewed = user.favourites.includes(restaurantId);
    let value = 0;
    if (!isReviewed) {
      user.favourites.push(restaurant);
      user.points += 5;
      value = 1;
    } else {
      user.favourites.pull(restaurantId);
      user.points -= 5;
      value = -1;
    }
    // save to database
    await user.save();
    await restaurant.updateFavourites(value);
    res.status(200).json({ message: "Action Success." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

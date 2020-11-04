const express = require("express");
const { body } = require("express-validator");
// MIDDLEWARES
const isAuth = require("../middleware/isAuth");
// CONTROLLER
const restaurantsController = require("../controllers/restaurants");

const router = express.Router();

// (test only) [put]creates a new restaurant / get list of restaurants
router
  .route("")
  .put(restaurantsController.createRestaurant)
  .get(isAuth, restaurantsController.getRestaurants);

router.get("/:restaurantId/details", isAuth, restaurantsController.getDetails);

// router.get("/:restaurantId/gallery", isAuth, restaurantsController.getGallery);

// router.get("/:restaurantId/rating", isAuth, restaurantsController.getRatings);

router
  .route("/:restaurantId/reviews")
  .get(isAuth, restaurantsController.getReviews)
  .post(
    isAuth,
    [
      body("rating").custom((value, { req }) => {
        if (!Number.isInteger(value)) {
          return Promise.reject("Please enter an integer");
        }
        if (value > 0 && value < 6) {
          return Promise.resolve(value);
        }
        return Promise.reject("Please enter a rating between 1-5");
      }),
      body("comment").trim(),
    ],
    restaurantsController.postReview
  );

router.post(
  "/:restaurantId",
  isAuth,
  restaurantsController.favouriteRestaurant
);

// router
//   .route("/:restaurantId/reviews/:reviewId")
//   .post(isAuth, restaurantsController.likeReview)
//   .patch(isAuth, restaurantsController.updateReview)
//   .delete(isAuth, restaurantsController.deleteReview);

module.exports = router;

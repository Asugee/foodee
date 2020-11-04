const express = require("express");
const { body } = require("express-validator");
// MIDDLEWARES
const isAuth = require("../middleware/isAuth");
// CONTROLLER
const usersController = require("../controllers/users");

const router = express.Router();

router.get("", isAuth, usersController.getUsers);

router.get("/:userId/details", isAuth, usersController.userDetails);

router.get("/:userId/overview", isAuth, usersController.userOverview);

router.get("/:userId/favourites", isAuth, usersController.userFavourites);

router.get("/:userId/reviews", isAuth, usersController.userReviews);

// router.get("/:userId/reviews", isAuth, usersController.terminateUser);

module.exports = router;

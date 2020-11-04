const express = require("express");
const { body } = require("express-validator");

const User = require("../models/user");
const authController = require("../controllers/auth");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .trim()
      .isEmail()
      .isLength({ max: 30 })
      .withMessage("Email too long")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("This email is already used.");
          }
        });
      })
      .escape(),
    body("username")
      .trim()
      .isLength({ min: 4, max: 16 })
      .withMessage("Enter a username between 4-16 characters")
      .custom((value, { req }) => {
        return User.findOne({ username: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("A user with this username already exists.");
          }
        });
      })
      .escape(),
    body("password")
      .trim()
      .isLength({ min: 7 })
      .withMessage("Enter a password that has more than 6 characters")
      .escape(),
  ],
  authController.signup
);

router.post("/login", authController.login);

module.exports = router;

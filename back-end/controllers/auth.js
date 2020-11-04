require("dotenv").config();

const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = async (req, res, next) => {
  try {
    // checks if user enter valid input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // gets input from body and hashes password
    const email = req.body.email;
    const username = req.body.username;
    const password = await bcrypt.hash(req.body.password, 12);
    // get date
    const dateJoined = new Date();
    // creates a new User based on input
    const user = new User({
      email: email,
      username: username,
      password: password,
      dateJoined: dateJoined,
    });
    // saves User to database
    const result = await user.save();
    // send response notifying success
    res
      .status(201)
      .json({ message: "User successfully created.", userId: result._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    // find a user with the same username as the request username
    const user = await User.findOne({ email: email });
    // if user is empty, no such user exist
    if (!user) {
      const error = new Error("Email or Password is incorrect.");
      error.statusCode = 401;
      throw error;
    }
    // compares user password with request password
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Email or Password is incorrect.");
      error.statusCode = 401;
      throw error;
    }
    // If no errors, creates a login token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token: token });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

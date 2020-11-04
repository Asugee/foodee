require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

// ROUTES
const authRoutes = require("./routes/auth");
const restaurantRoutes = require("./routes/restaurants");
const userRoutes = require("./routes/users");

const app = express();

app.use(express.json());

// ROUTES
app.use("/auth", authRoutes);
app.use("/foodee/restaurants", restaurantRoutes);
app.use("/foodee/users", userRoutes);

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));

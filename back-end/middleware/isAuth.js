require("dotenv").config();

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // gets the Authorization header from request
  const authHeader = req.get("Authorization");
  // if no such header exist user isn't logged in
  if (!authHeader) {
    const error = new Error("No Authorization found.");
    error.statusCode = 401;
    throw error;
  }
  // splits the 'Bearer' and token
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    // verify the token
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    // if faked or manipulated, verification failed
    err.statusCode = 500;
    throw err;
  }
  // uhhh...
  if (!decodedToken) {
    const error = new Error("Not authenticated.");
    error.statusCode = 401;
    throw error;
  }
  // notify the servers this user is logged in with this id
  req.userId = decodedToken.userId;
  next();
};

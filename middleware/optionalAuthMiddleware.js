const jwt = require("jsonwebtoken");

function optionalAuthMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    req.user = null;
  }

  next();
}

module.exports = optionalAuthMiddleware;

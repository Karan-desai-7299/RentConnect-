const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  let token;

  // Read token from Bearer header or cookie (if cookies are implemented, otherwise header is standard)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      
      if (user.isBanned) {
        return res.status(403).json({ message: "Your account is banned" });
      }
      
      req.user = user;
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user ? req.user.role : "none"}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };

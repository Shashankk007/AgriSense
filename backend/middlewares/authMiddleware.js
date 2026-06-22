const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Fetching the token from cookies. Ensure that the cookie-parser middleware is used in your Express app to parse cookies.
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' });
  }

  try {
    // Verify Token using the secret key and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; //Send the Decoded user info to the next middleware or route handler
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: "Niste autorizovani."
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Nemate dozvolu za ovu akciju."
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
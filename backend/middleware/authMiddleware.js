const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("token");

    if (!token) {
      return res.status(401).json({
        message: "Nema tokena, pristup odbijen"
      });
    }

    const verify = jwt.verify(token, process.env.JWT_SECRET);

    req.user = verify;

    next();
  } catch (err) {
    console.log(err.message);

    return res.status(401).json({
      message: "Token nije validan"
    });
  }
};
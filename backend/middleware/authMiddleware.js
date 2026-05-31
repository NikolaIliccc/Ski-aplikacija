const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {

  try {

    // uzimanje tokena iz headera
    const token = req.header("token");

    // ako nema tokena
    if (!token) {
      return res.status(401).json({
        message: "Nema tokena, pristup odbijen"
      });
    }

    // verifikacija tokena
    const verify = jwt.verify(token, "tajna123");

    // ubacujemo user podatke u req
    req.user = verify;

    next();

  } catch (err) {

    console.log(err.message);

    return res.status(401).json({
      message: "Token nije validan"
    });

  }

};
//@ts-check
const Models = require('../models');
const users = Models.users;
const authService = require('../services/auth.service');
// const userService = require('../services/users.service');
module.exports.authChecker = async (req, res, next) => {
  var token = req.headers.authorization;
  if (token) {
    console.info(token, "---token---9")
    await authService.verifyJwtToken(token, async function (err, decoded) {
      if (err) {
        console.error(err.message, "---error---11");
        return res.status(403).json({ success: false, data: null, msg: 'Invalid token' });
      } else {
        try {
          users.findOne({ where: { id: decoded.id, isVerified: true, isRegister: true, isDeleted: false } })
            .then(async (user) => {
              console.info(user, "---user---17")
              if (!user) return res.status(403).json({ success: false, data: null, msg: 'User not found Invalid token' });
              req.decoded = { ...decoded, role: user.role };
              console.info(req.decoded, "---req.decoded---20")
              next();
            })
            .catch((err) => {
              console.error(err, 'auth token error');
              return res.status(403).json({ success: false, data: null, msg: 'Invalid token' });
            });
        } catch (error) {
          console.error(error, "---error---35");
          return res.status(403).json({ success: false, data: null, msg: 'Invalid token' });
        }
      }
    });
  } else {
    return res.status(403).json({ success: false, data: null, msg: 'Invalid request' });
  }
};


module.exports.authCheckerAdmin = async (req, res, next) => {
  var token = req.headers.authorization;
  if (token) {
    await authService.verifyJwtToken(token, async function (err, decoded) {
      if (err) {
        console.error(err)
        return res.status(403).json({ success: false, data: null, msg: "Invalid token" })
      } else {
        try {
          users.findOne({ where: { id: decoded.id, role: 1, isVerified: true, isRegister: true, isDeleted: false } }).then(async (user) => {
            if (!user) return res.status(403).json({ success: false, data: null, msg: "User not found Invalid token" });
            req.decoded = { ...decoded, role: user.role };
            next();
          }).catch((err) => {
            return res.status(403).json({ success: false, data: null, msg: "Invalid token" });
          })
        } catch (error) {
          console.error(error)
          return res.status(403).json({ success: false, data: null, msg: "Invalid token" });
        }
      }
    });
  } else {
    return res.status(403).json({ success: false, data: null, msg: "Invalid request" })
  }
};
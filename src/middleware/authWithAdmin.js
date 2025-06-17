//@ts-check
const Models = require('../models');
const users = Models.users;
const authService = require('../services/auth.service')
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
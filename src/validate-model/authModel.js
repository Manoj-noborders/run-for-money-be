var Joi = require("joi");
module.exports.signUpWithEmail = Joi.object({
    email: Joi.string().required()
});
module.exports.updateBattleRestrictionStatus = Joi.object({
    isLimitedBattles: Joi.boolean().required()
});
module.exports.signUpWithPhone = Joi.object({
    phoneNumber: Joi.string().required()
});
module.exports.verifyOtpForEmail = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().required(),
});
module.exports.passwordWithEmail = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});
module.exports.verifyOtpForPhone = Joi.object({
    phoneNumber: Joi.string().required(),
    otp: Joi.string().required(),
});
module.exports.passwordWithPhone = Joi.object({
    phoneNumber: Joi.string().required(),
    password: Joi.string().required(),
});
module.exports.signIn = Joi.object({
    email: Joi.string().email().allow("").allow(null).optional(),
    phoneNumber: Joi.string().allow("").allow(null).optional(),
    password: Joi.string().required(),
});
module.exports.resendOtp = Joi.object({
    email: Joi.string().email().allow("").allow(null).optional(),
    phoneNumber: Joi.string().allow("").allow(null).optional()
});
module.exports.forgotPassword = Joi.object({
    userName: Joi.string().required()
});
module.exports.verifyForgotPasswordOTP = Joi.object({
    userName: Joi.string().required(),
    otp: Joi.string().required()
});
module.exports.resetPassword = Joi.object({
    password: Joi.string().required()
});
module.exports.resetPassword = Joi.object({
    password: Joi.string().required()
});
module.exports.sendOtpForPhone = Joi.object({
    phoneNumber: Joi.string().required(),
    source: Joi.string().allow("").allow(null).optional()
});
module.exports.getUserNonce = Joi.object({
    walletAddress: Joi.string().required()
});
module.exports.saveUserNonce = Joi.object({
    walletAddress: Joi.string().required(),
    nonce: Joi.string().required()
});
module.exports.verifyUserSignatureV2 = Joi.object({
    nonce: Joi.string().required(),
    signature: Joi.string().required(),
    deviceId: Joi.string().required()
});
module.exports.verifyOtpForPhone = Joi.object({
    phoneNumber: Joi.string().required(),
    otp: Joi.string().required(),
});
module.exports.registerWithPhone = Joi.object({
    phoneNumber: Joi.string().required(),
    password: Joi.string().required(),
});
module.exports.sendOtpForEmail = Joi.object({
    email: Joi.string().email().required(),
    source: Joi.string().allow("").allow(null).optional()
});
module.exports.sendOtpForCryptoEmail = Joi.object({
    email: Joi.string().email().required()
});
module.exports.verifyOtpForEmail = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().required(),
});
module.exports.getUserIdByEmail = Joi.object({
    email: Joi.string().email().required()
});
module.exports.signIn = Joi.object({
    email: Joi.string().email().allow("").allow(null).optional(),
    phoneNumber: Joi.string().allow("").allow(null).optional(),
    password: Joi.string().required(),
    deviceId: Joi.string().required(),
});
module.exports.logoutFromOtherDevices = Joi.object({
    email: Joi.string().email().allow("").allow(null).optional(),
    phoneNumber: Joi.string().allow("").allow(null).optional(),
    password: Joi.string().required()
});
module.exports.resendOtp = Joi.object({
    email: Joi.string().email().allow("").allow(null).optional(),
    phoneNumber: Joi.string().allow("").allow(null).optional()
});
module.exports.forgotPassword = Joi.object({
    userName: Joi.string().required()
});

module.exports.blockChainFuelUpdate = Joi.object({
    address: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/),  //walletAddress
    // fuel: Joi.number().required()
});

module.exports.appleGuestLoginToggleDto = Joi.object({
    version: Joi.string().required(),
    apple_guest_login: Joi.boolean().required()
});

exports.deviceIdVldtr = Joi.object({
    deviceId: Joi.string().required()
});

exports.saveDeviceFromXanaliaSchema = Joi.object({
    deviceId: Joi.string().required(),
    forced: Joi.boolean().optional()
});

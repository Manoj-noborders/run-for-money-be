
const Models = require('../models');
const deviceTokens = Models.deviceTokens;
const userDevices = Models.userDevices;
module.exports = {
    async getDeviceToken(userId, deviceToken) {
        return await deviceTokens.findOne({ where: { userId: userId, token: deviceToken } });
    },
    async createDeviceToken(data) {
        return await deviceTokens.create(data);
    },
    async destroyDeviceToken(id) {
        return await deviceTokens.destroy({ where: { id } });
    },
    async destroyDeviceTokenByUserId(userId) {
        return await deviceTokens.destroy({ where: { userId: userId } });
    },

    async getRfmDevice(userId, deviceId, native_app_id) {
        return await userDevices.findOne({ where: { userId, deviceId, native_app_id } })
    },

    async destroyRfmDevice(userId, deviceId, native_app_id) {
        return await userDevices.destroy({ where: { userId, deviceId, native_app_id }, returning: true })
    },

    async destroyAllRfmDevices(userId, native_app_id) {
        return await userDevices.destroy({ where: { userId, native_app_id }, returning: true })
    }
}
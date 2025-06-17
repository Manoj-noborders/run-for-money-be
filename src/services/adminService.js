//@ts-check
const Models = require('../models');
const features_control = Models.features_control;


module.exports = {
    async createFeatureControl(data) {
        return await features_control.create(data);
    },

    async getAllFeaturesList() {
        return await features_control.findAll({
            raw: true
        });
    },

    async getSingleFeatureByName(feature_name) {
        return await features_control.findOne({
            where: { feature_name: feature_name },
            raw: true
        });
    },

    async updateFeatureStatus(data, id) {
        return await features_control.update(data, { where: { id: id }, raw: true, returning: true });
    },


    async getAppAllVersions() {
        return await Models.app_version.findAll({
            order: [
                ['createdAt', 'DESC'],
            ],
            raw: true
        })
    },

    async getAppVersionByName(name) {
        return await Models.app_version.findOne({ where: { name: name } })
    },

    async updateAppVersion(data, id) {
        return await Models.app_version.update(data, { where: { id: id } });
    },

    async createAppVersion(data) {
        return await Models.app_version.create(data);
    },

    async updateSkillDetails(id, data) {
        return await Models.skills.update(data, { where: { id: id }, returning: true, raw: true });
    },

    async getMatchingInterval() {
        const interval = await Models.game_settings.findOne({ where: { id: 1 }, raw: true });
        const intervalMinutes = interval.interval_minutes;
        const now = new Date();
        const nextPlayTime = new Date(
            Math.ceil(now.getTime() / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000)
        );
        return {
            intervalMinutes: intervalMinutes,
            nextPlayTime: nextPlayTime
        }
    },

    async updateMatchingInterval(interval_minutes) {
        return await Models.game_settings.update({ interval_minutes: interval_minutes }, { where: { id: 1 } });
    },

}
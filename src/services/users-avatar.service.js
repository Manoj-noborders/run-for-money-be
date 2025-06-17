const models = require('../models');


exports.getUserAvatarByUserId = async (user_id) => {
    const userAvatar = await models.rfm_user_avatar.findOne({
        where: { user_id: user_id },
        // attributes: {
        //     exclude: ['createdAt', 'updatedAt']
        // },
        raw: true
    });
    return userAvatar;
}

exports.setUserAvatarIndexByUserId = async (user_id, avatar_index) => {
    const userAvatar = await models.rfm_user_avatar.update({ avatar_index: avatar_index }, { where: { user_id: user_id }, returning: true, raw: true });
    return userAvatar;
}

exports.updateUserAvatarByUserId = async (user_id, data) => {
    const userAvatar = await models.rfm_user_avatar.update(data, { where: { user_id: user_id }, returning: true, raw: true });
    return userAvatar;
}

exports.createOrUpdateUserAvatar = async (user_id, data) => {
    const avt = await models.rfm_user_avatar.findOne({ where: { user_id: user_id }, raw: true });
    if (avt) {
        const userAvatar = await models.rfm_user_avatar.update(data, { where: { user_id: user_id }, returning: true, raw: true });
        return userAvatar;
    } else {
        const newAvatar = await models.rfm_user_avatar.create({ user_id, ...data });
        return newAvatar;
    }
}


exports.removeUserAvatarByUserId = async (user_id) => {
    const userAvatar = await models.rfm_user_avatar.destroy({ where: { user_id: user_id } });
    return userAvatar;
}
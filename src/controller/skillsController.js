// @ts-check
const svc = require('../services/skills.service');


/**
 * @api {get} /skills/get-all-skills  Get All Skills
 * @apiName Get All Skills
 * @apiGroup User Skills
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiDescription  This Api gives list of all skills..
 */
exports.getAvailableSkills = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const skills = await svc.getAvailableSkills(userId);
        return res.status(200).json({ success: true, data: skills, msg: 'Skills list fetched' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
};

/**
 * @api {post} /skills/acquire-skill/:skillId  Acquire Skill
 * @apiName Acquire Skill
 * @apiGroup User Skills
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} skillId Skill Id
 * @apiDescription  This Api acquires a skill for user..
 */
exports.acquireSkill = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const skillId = req.params.skillId;
        const result = await svc.acquireSkill(userId, skillId);
        return res.status(200).json({ success: true, data: result, msg: 'New skill acquired' });
    } catch (error) {
        console.error(error.message || error);
        return res.status(error.code || 500).send({ success: false, data: null, msg: error.message || 'Internal server error' });
    }
};

/**
 * @api {get} /skills/get-user-skills/:userId  Get User Skills
 * @apiName Get User Skills
 * @apiGroup User Skills
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} userId User Id
 * @apiDescription  This Api gives list of all skills acquired by a user..
 */
exports.getUserSkills = async (req, res) => {
    try {
        const userId = req.params.userId;
        const skills = await svc.getUserSkills(userId);
        if (!skills.length) return res.status(200).json({ success: true, data: [], msg: 'No skills found for the user' });

        return res.status(200).json({ success: true, data: skills, msg: 'User Skills fetched sucessfully' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
};



/**
 * @api {post} /skills/acquire-default-skills  Acquire Default User Skills
 * @apiName Acquire Default User Skills
 * @apiGroup User Skills
 * @apiHeader {String} Authorization User's unique access-key.
 * @apiDescription  This Api gives list of all default skills acquired by a user, if any not acquired.? It assign them to user..
 */
exports.acquireDefaultSkills = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const result = await svc.acquireDefaultSkills(userId);
        return res.status(200).json({ success: true, data: result, msg: 'Default skills acquired' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: null, msg: error.message || 'Internal server error' });
    }
}
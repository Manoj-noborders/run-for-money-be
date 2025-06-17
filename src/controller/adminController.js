//@ts-check
const adminService = require('../services/adminService.js');



/**
 * @api {get} /admin/get-features-list Get App Features List
 * @apiName GetFeaturesList
 * @apiGroup Admin
 * @apiDescription This gives list of all the features that admin can maintain.
 */
module.exports.getFeaturesList = async (req, res) => {
    try {
        let result = await adminService.getAllFeaturesList();
        console.log(result, "---result---104")

        return res.status(200).send({ success: true, data: result, msg: "Features List Get Successfully" });
    } catch (error) {
        return res.status(500).send({ success: false, data: error, msg: "Internal server error" });
    }
}


/**
 * @api {post} /admin/update-feature-control  Add or Update App Feature Control
 * @apiName AddFeatureControl
 * @apiGroup Admin
 * @apiHeader {String} Authorization Admin's access-key.
 * @apiBody {String}  feature_name  Name of the feature.
 * @apiBody {Boolean}  feature_status status of feature.
 * @apiDescription This api add or update a feature control.
 */
module.exports.addFeatureControl = async (req, res) => {
    try {
        const { feature_name, feature_status } = req.body;
        let findFeature = await adminService.getSingleFeatureByName(feature_name);
        if (findFeature) {
            let result = await adminService.updateFeatureStatus({ feature_name, feature_status }, findFeature.id)
            return res.status(200).send({ success: false, data: result[1][0], msg: "Feature status updated" });
        } else {
            let result = await adminService.createFeatureControl({ feature_name: feature_name, feature_status: feature_status });
            return res.status(200).send({ success: true, data: result, msg: "Feature Created Successfully" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, data: error, msg: "Internal server error" });
    }
}


/**
 * @api {get} /app/get-all-version Get App All Version
 * @apiName Get App Version
 * @apiGroup RFM Version
 * @apiDescription App Version Service..
 */
exports.getAppVersion = async (req, res) => {
    try {
        let result = await adminService.getAppAllVersions()
        if (result) {
            return res.status(200).json({ success: true, data: { version: result, utcTime: new Date().toISOString() }, msg: "RFM Version Get Successfully" });
        } else {
            return res.status(200).json({ success: true, data: null, msg: "RFM Version Get Successfully" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, data: error, msg: "Internal server error" });
    }
}


/**
 * @api {post} /app/add-update-version Add Update RFM Version
 * @apiName Add Update RFM Version
 * @apiGroup RFM Version
 * @apiHeader {String} Authorization Admin's unique access-key.
 * @apiParam {String}  name  name/semver of RFM Version.
 * @apiParam {Boolean}  forceUpdateRestricted  forceUpdateRestricted of RFM Version.
 * @apiParam {Boolean}  isMaintenance  isMaintenance of RFM Version.
 * @apiDescription RFM Version Service..
 */
exports.addUpdateAppVersion = async (req, res) => {
    try {
        let findVersion = await adminService.getAppVersionByName(req.body.name);
        if (findVersion) {
            await adminService.updateAppVersion({ name: req.body.name, forceUpdateRestricted: req.body.forceUpdateRestricted, isMaintenance: req.body.isMaintenance }, findVersion.id)
            return res.status(200).json({ success: true, data: null, msg: "RFM Version Updated Successfully" });
        } else {
            let result = await adminService.createAppVersion({ name: req.body.name, forceUpdateRestricted: req.body.forceUpdateRestricted, isMaintenance: req.body.isMaintenance });
            return res.status(201).json({ success: true, data: result, msg: "RFM Version Created Successfully" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, data: error, msg: "Internal server error" });
    }
}


/**
 * @api {put} /admin/update-skill/:id Update Skill Details
 * @apiName UpdateSkillDetails
 * @apiGroup Admin
 * @apiHeader {String} Authorization Admin's access-key.
 * @apiParam {Number}  id  Skill Id.
 * @apiParam {String}  [skill_name]  Name of the skill.
 * @apiParam {String}  [category] Category of the skill.
 * @apiParam {Number}  [xp_required] Xp required for the skill.
 * @apiDescription This api updates a skill
 */
exports.updateSkillDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log(updateData, "---updateData---");
        const [num, result] = await adminService.updateSkillDetails(id, updateData);
        if (num === 0) {
            return res.status(400).json({ success: false, data: null, msg: "Skill data not updated" });
        }
        return res.status(200).json({ success: true, data: result, msg: "Skill Updated Successfully" });
    } catch (error) {
        console.error(error, 'here.?');
        return res.status(500).json({ success: false, data: error, msg: "Internal server error" });
    }
}

/**
 * @api {get} /get-matching-interval Get Matching Interval
 * @apiName GetMatchingInterval
 * @apiGroup Admin
 * @apiDescription This api gets the matching interval for the game.
 */
exports.getMatchingInterval = async (req, res) => {
    try {
        let result = await adminService.getMatchingInterval();
        return res.status(200).send({ success: true, data: result, msg: "Matching Interval Get Successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, data: error, msg: "Internal server error" });
    }
}

/**
 * @api {put} /admin/update-matching-interval Update Matching Interval
 * @apiName UpdateMatchingInterval
 * @apiGroup Admin
 * @apiHeader {String} Authorization Admin's access-key.
 * @apiParam {Number}  interval_minutes  Interval in minutes.
 * @apiDescription This api updates the matching interval for the game.
 */
exports.updateMatchingInterval = async (req, res) => {
    try {
        const { interval_minutes } = req.body;
        let result = await adminService.updateMatchingInterval(interval_minutes);
        return res.status(200).send({ success: true, data: result, msg: "Matching Interval Updated Successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, data: error, msg: "Internal server error" });
    }
}
//@ts-check
const Models = require('../models');
const { UserInputError } = require('../utils/classes');

const users = Models.users;
const userExperience = Models.userExperience;
const userSkills = Models.user_skills;

class SkillsService {
    async getAvailableSkills(userId) {
        // Fetch all acquired skills by the user
        const acquiredUserSkills = await Models.user_skills.findAll({
            where: { user_id: userId },
            attributes: ['skill_id'],
            raw: true
        });

        // Get the list of acquired skill IDs
        const acquiredSkillIds = acquiredUserSkills.map(userSkill => userSkill.skill_id);

        // Fetch all skills (those the user can afford based on their XP)
        const user = await users.findByPk(userId);
        if (!user) throw new Error('User not found');

        const availableSkills = await Models.skills.findAll({
            attributes: {
                exclude: ['created_at', 'updated_at']
            },
            raw: true
        });

        // Map the available skills and include the `acquired` boolean flag
        const skillsWithAcquiredStatus = availableSkills.map(skill => ({
            id: skill.id,
            skill_name: skill.skill_name,
            category: skill.category,
            xp_required: skill.xp_required,
            acquired: acquiredSkillIds.includes(skill.id) // Check if skill is acquired by user
        }));

        return skillsWithAcquiredStatus;
    }

    async acquireSkill(userId, skillId) {
        const user = await await userExperience.findOne({ where: { userId }, raw: true });
        if (!user) throw new UserInputError('You need to have some experience first');

        const skill = await Models.skills.findByPk(skillId);
        if (!skill) throw new UserInputError('Skill not found');

        if (user.player_xp < skill.xp_required) throw new UserInputError('Insufficient XP');

        let skill_id = Number(skill.id);
        // Check if user already has the skill
        const existingSkill = await userSkills.findOne({
            where: { user_id: userId, skill_id },
            attributes: ['user_id', 'skill_id'], raw: true
        });
        // console.info(existingSkill)
        if (existingSkill) throw new UserInputError('Skill already acquired');

        // Deduct XP and acquire skill
        const [_, plyrxp] = await userExperience.update({ player_xp: user.player_xp - skill.xp_required }, { where: { userId }, returning: true, raw: true });

        const f = {
            user_id: userId,
            skill_id: Number(skill.id),
            acquired_at: new Date()
        }
        // console.log(f)
        const newSkill = await userSkills.create(f, { returning: true, raw: true, fields: ['user_id', 'skill_id', 'acquired_at'] });

        return { player_xp: plyrxp.player_xp, skill: newSkill };
    }

    async getUserSkills(userId) {
        const userSkills = await Models.user_skills.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Models.skills,
                    attributes: ['skill_name', 'category',],
                    as: 'skill'
                }
            ],
        });
        const skills = userSkills.map(userSkill => ({
            skill_name: userSkill.skill.skill_name,
            category: userSkill.skill.category
        }));
        return skills;
    }


    async acquireDefaultSkills(userId) {
        // get default skills
        const defaultSkills = await Models.skills.findAll({
            where: { xp_required: 0 },
            attributes: ['id'],
            raw: true
        });

        if (!defaultSkills || defaultSkills.length === 0) throw new Error('No default skills found');

        const defaultSkillIds = defaultSkills.map(skill => skill.id);

        // * get user acquired default skills
        const acquiredUserSkills = await Models.user_skills.findAll({
            where: { user_id: userId, skill_id: defaultSkillIds },
            attributes: ['skill_id'],
            raw: true
        });

        // * Get the list of acquired skill IDs
        const acquiredSkillIds = acquiredUserSkills.map(userSkill => userSkill.skill_id);

        if (acquiredSkillIds.length !== defaultSkillIds.length) {
            // * Filter out already acquired skills
            const newSkills = defaultSkills.filter(skill => !acquiredSkillIds.includes(skill.id));

            // * Acquire new skills
            const newSkillsData = newSkills.map(skill => ({
                user_id: userId,
                skill_id: skill.id,
                acquired_at: new Date()
            }));

            // * Create new skills
            await Models.user_skills.bulkCreate(newSkillsData, { fields: ['user_id', 'skill_id', 'acquired_at'] });
        }

        return this.getUserSkills(userId);

    }

}

module.exports = new SkillsService();
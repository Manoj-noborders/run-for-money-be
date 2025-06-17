//@ts-check

const Models = require('../models');
const { UserInputError } = require('../utils/classes');


const abilities = Models.abilities;
const user_inventory = Models.user_inventory;



exports.getAllGameAbilities = async (filter) => {
    const where = {};
    if (filter) {
        if (filter.type) where.type = filter.type;
    }
    const skills = await abilities.findAll({
        where,
        attributes: {
            exclude: ['created_at', 'updated_at']
        },
        raw: true
    });

    return skills;
}



exports.createUserBasicAbilities = async (user_id) => {
    const abilitis = await abilities.findAll({
        where: { type: 'basic' },
        attributes: ['id'],
        raw: true
    });

    if (!abilitis || abilitis.length === 0) throw new Error('No basic abilities found');

    const abilityIds = abilitis.map(ability => ability.id);

    // * get user acquired default skills
    const acquiredUserAbilities = await user_inventory.findAll({
        where: { user_id, ability_id: abilityIds },
        attributes: ['ability_id'],
        raw: true
    });

    // * Get the list of acquired skill IDs
    const acquiredAbilityIds = acquiredUserAbilities.map(userAbility => userAbility.ability_id);

    if (acquiredAbilityIds.length !== abilityIds.length) {
        // * Filter out already acquired skills
        const newAbilities = abilitis.filter(ability => !acquiredAbilityIds.includes(ability.id));

        const INITIAL_LEVEL = process.env.BASIC_ABILITY_INIT_LEVEL || 20;
        // * Acquire new skills
        const newAbilitiesData = newAbilities.map(ability => ({
            user_id,
            ability_id: ability.id,
            level: INITIAL_LEVEL,
            is_equipped: false,
            acquired_at: new Date()
        }));

        // * Create new skills
        await user_inventory.bulkCreate(newAbilitiesData, { fields: ['user_id', 'ability_id', 'level', 'is_equipped', 'acquired_at'] });
    }

    return this.getUserAcquiredAbilities(user_id);
}


exports.getUserAcquiredAbilities = async (userId) => {
    const userAbilities = await user_inventory.findAll({
        where: { user_id: userId },
        include: [
            {
                model: abilities,
                attributes: ['id', 'name', 'type', 'description', 'effect_value'],
                as: 'ability'
            }
        ],
    });
    const usr_abilities = userAbilities
        .filter(userAbility => !(userAbility.ability.type === 'special' && userAbility.level === 0))
        .map(userAbility => ({
            ability_id: userAbility.ability.id,
            name: userAbility.ability.name,
            type: userAbility.ability.type,
            level: userAbility.level,
            is_equipped: userAbility.is_equipped,
            acquired_at: userAbility.acquired_at,
            description: userAbility.ability.description,
            effect_value: userAbility.ability.effect_value
        }));

    return usr_abilities;
}

exports.toggleUserAbility = async (userId, abilityId) => {
    try {
        // Find the user's ability
        const userAbility = await user_inventory.findOne({
            where: {
                user_id: userId,
                ability_id: abilityId
            }
        });

        if (!userAbility) {
            throw new UserInputError('Ability not found for the user');
        }

        // Toggle the is_equipped field
        userAbility.is_equipped = !userAbility.is_equipped;

        // Save the updated ability
        await userAbility.save();

        return userAbility;
    } catch (error) {
        console.error('Error toggling user ability:', error);
        throw error;
    }
};


exports.toggleUserAbilityV2 = async (userId, abilityId) => {
    try {
        // Find the user's ability
        const userAbility = await user_inventory.findOne({
            where: {
                user_id: userId,
                id: abilityId
            }
        });

        if (!userAbility) {
            throw new UserInputError('Ability not found for the user');
        }

        // Toggle the is_equipped field
        userAbility.is_equipped = !userAbility.is_equipped;

        // Save the updated ability
        await userAbility.save();

        return userAbility;
    } catch (error) {
        console.error('Error toggling user ability:', error);
        throw error;
    }
};


exports.burnSpclSkillUsedInGame = async (userId, abilityId) => {
    const userAbility = await user_inventory.findOne({ where: { user_id: userId, id: abilityId }, raw: true });
    if (!userAbility) throw new UserInputError('User doesnt has this ability');

    // delete user ability
    // let dltd = await user_inventory.decrement('level', { where: { user_id: userId, ability_id: abilityId } });
    let dltd = await user_inventory.decrement('level', { where: { id: userAbility.id } });
    dltd = dltd[0];

    // un equip the ability
    await user_inventory.update({ is_equipped: false }, { where: { id: userAbility.id } });

    return dltd;
}

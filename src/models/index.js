
const db = require('../database/database.js');

const { users,
    leagues,
    leaguesDetails,
    userLeagues,
    userLeaguesHistories,
    rfm_user_avatar,
    userXetaBalance,
    userExperience,
    skills,
    user_skills,
    abilities,
    gacha_items,
    user_inventory,
    user_gacha_levels,
    user_gacha_tickets,
    user_purchases,
    inapp_items,
    gachas,
    battle_logs,
    battles,
    gacha_reward_settings,
    rfm_player_config
} = db.models;

userLeagues.belongsTo(users, { foreignKey: 'userId', sourceKey: 'id' });
users.hasMany(userLeagues, { onDelete: 'cascade', hooks: true });

userExperience.belongsTo(users, { foreignKey: 'userId', sourceKey: 'id' });
users.hasMany(userExperience, { onDelete: 'cascade', hooks: true });

userLeagues.belongsTo(leagues, { foreignKey: 'leagueId', sourceKey: 'id' });
leagues.hasOne(userLeagues, { onDelete: 'cascade', hooks: true });

leaguesDetails.belongsTo(leagues, { foreignKey: 'leagueId', sourceKey: 'id' });
leagues.hasOne(leaguesDetails, { onDelete: 'cascade', hooks: true });

userXetaBalance.belongsTo(users, { foreignKey: 'userId', sourceKey: 'id' });
users.hasMany(userXetaBalance, { onDelete: 'cascade', hooks: true });


userLeaguesHistories.belongsTo(users, { foreignKey: 'userId', sourceKey: 'id' });
users.hasMany(userLeaguesHistories, { onDelete: 'cascade', hooks: true });


rfm_user_avatar.belongsTo(users, { foreignKey: 'user_id', sourceKey: 'id' });
users.hasMany(rfm_user_avatar, { foreignKey: 'user_id', sourceKey: 'id' });

users.belongsToMany(skills, { through: user_skills, as: 'skills', foreignKey: 'user_id' });
// skills.belongsToMany(users, { through: 'user_skills' });
user_skills.belongsTo(skills, { foreignKey: 'skill_id', as: 'skill' });


gacha_items.belongsTo(abilities, { foreignKey: 'ability_id' });
abilities.hasMany(gacha_items, { foreignKey: 'ability_id', sourceKey: 'id' });

abilities.hasMany(user_inventory, { foreignKey: 'ability_id', sourceKey: 'id' });
user_inventory.belongsTo(abilities, { foreignKey: 'ability_id', targetKey: 'id' });

user_gacha_levels.belongsTo(users, { foreignKey: 'user_id', sourceKey: 'id' });
users.hasMany(user_gacha_levels, { onDelete: 'cascade', hooks: true });

user_inventory.belongsTo(users, { foreignKey: 'user_id', sourceKey: 'id' });
users.hasMany(user_inventory, { foreignKey: 'user_id', sourceKey: 'id' });


user_gacha_tickets.belongsTo(users, { foreignKey: 'user_id', sourceKey: 'id' });
users.hasMany(user_gacha_tickets, { onDelete: 'cascade', hooks: true });

user_gacha_tickets.belongsTo(gachas, { foreignKey: 'gacha_id', sourceKey: 'id' });
gachas.hasMany(user_gacha_tickets, { foreignKey: 'gacha_id', sourceKey: 'id' });

gachas.hasMany(user_gacha_levels, { foreignKey: 'gacha_id', as: 'userGachaLevels' });
user_gacha_levels.belongsTo(gachas, { foreignKey: 'gacha_id', as: 'gacha' });

battle_logs.belongsTo(users, { foreignKey: 'id', sourceKey: 'user_id' });
users.hasMany(battle_logs, { foreignKey: 'user_id', sourceKey: 'id' });

battle_logs.belongsTo(battles, { foreignKey: 'id', sourceKey: 'battle_id' });
battles.hasMany(battle_logs, { foreignKey: 'battle_id', sourceKey: 'id' });

gacha_reward_settings.belongsTo(gachas, { foreignKey: 'gacha_id', sourceKey: 'id' });
gachas.hasOne(gacha_reward_settings, { foreignKey: 'gacha_id', sourceKey: 'id' });

// console.info(db.models, "---database.models---")

module.exports = db.models;

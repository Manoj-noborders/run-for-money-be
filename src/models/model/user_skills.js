const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const UserSkill = sequelize.define('user_skills', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false, },
        skill_id: {
            type: DataTypes.INTEGER, allowNull: false,
            references: { model: 'skills', key: 'id' }
        },
        acquired_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    }, {
        tableName: `${pkg.name}_user_skills`,
        underscored: true,
        timestamps: false
    });

    return UserSkill;
};

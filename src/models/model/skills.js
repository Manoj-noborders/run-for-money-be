
const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const rfm_game_skills = sequelize.define('skills', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        skill_name: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.STRING, allowNull: false },
        xp_required: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    }, {
        timestamps: true,
        tableName: `${pkg.name}_skills`,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    rfm_game_skills.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return rfm_game_skills;
}

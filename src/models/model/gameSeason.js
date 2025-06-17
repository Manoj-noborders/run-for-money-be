const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
  const gameSeason = sequelize.define('gameSeason', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    seasonId: { type: DataTypes.INTEGER, allowNull: false },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    block_time: { type: DataTypes.STRING, allowNull: true },
    default_rating: { type: DataTypes.INTEGER, allowNull: true },
    default_league: { type: DataTypes.INTEGER, allowNull: true },
    genesis_reward: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    season_reward: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    top_users: { type: DataTypes.JSONB },
    has_reset_users: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
    {
      tableName: `${pkg.name}_seasons`,
      modelName: 'gameSeason', timestamps: true
    }
  );
  gameSeason.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
  };
  return gameSeason;
};

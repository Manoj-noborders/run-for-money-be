const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
  const userDuels = sequelize.define('userDuels', {
    id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true, },
    hunterId: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
    runnerId: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
    roomId: { type: DataTypes.STRING, allowNull: true },
    leagueId: { type: DataTypes.INTEGER, allowNull: true },
    duelStartDate: { type: DataTypes.DATE, allowNull: false },
    duelEndDate: { type: DataTypes.DATE, allowNull: true },
    winnerId: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: true },
    loserId: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: true },
    is_draw: { type: DataTypes.BOOLEAN, allowNull: true },
    has_ended: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    fuel_won: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    fuel_win_percentage: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    seasonId: { type: DataTypes.INTEGER, allowNull: true },
  },
    {
      tableName: `${pkg.name}_user_duels`,
    }
  );
  userDuels.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
  };
  return userDuels;
};

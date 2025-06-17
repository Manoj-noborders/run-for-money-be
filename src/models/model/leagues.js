const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
  const leagues = sequelize.define(
    'leagues',
    {
      name: { type: DataTypes.STRING, allowNull: false },
      groupId: { type: DataTypes.INTEGER, allowNull: false },
      hp: { type: DataTypes.INTEGER, allowNull: false },
      initialManaCost: { type: DataTypes.INTEGER, allowNull: false },
      increaseManaCount: { type: DataTypes.INTEGER, allowNull: false },
      minFuelReq: {
        type: DataTypes.INTEGER,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('minFuelReq');
          return rawValue == null ? 0 : rawValue;
        }
      },
      fuelConsuption: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('fuelConsuption');
          return rawValue == null ? 0 : rawValue;
        }
      }
    },
    {
      tableName: `${pkg.name}_leagues`,
    }
  );
  leagues.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
  };
  return leagues;
};

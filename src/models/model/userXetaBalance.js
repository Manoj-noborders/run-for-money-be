const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const userXetaBalance = sequelize.define('userXetaBalance',
        {
            userId: { type: DataTypes.INTEGER, allowNull: false, },
            balance: { type: DataTypes.BIGINT, allowNull: false, },
        },
        {
            tableName: `${pkg.name}_user_xeta_balance`,
        }
    );
    userXetaBalance.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return userXetaBalance;
};

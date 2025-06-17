const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const xetaBalanceTxn = sequelize.define('xetaBalanceTxn',
        {
            userId: {type: DataTypes.INTEGER, allowNull: false, },
            userWallet: {type: DataTypes.STRING, allowNull: false, },
            amount: {type: DataTypes.BIGINT, allowNull: false, },
            txnHash: {type: DataTypes.STRING, allowNull: false, },
        },
        {
            tableName: `${pkg.name}_xeta_balance_txn`,
        }
    );
    xetaBalanceTxn.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return xetaBalanceTxn;
};

const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const quotes = sequelize.define('quotes', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        quote: { type: DataTypes.STRING, allowNull: false },
    }, {
        tableName: `${pkg.name}_quotes`,
        timestamps: true,
    });

    quotes.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return quotes;
};
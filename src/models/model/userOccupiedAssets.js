module.exports = (sequelize, DataTypes) => {
    const userOccupiedAssets = sequelize.define('userOccupiedAssets', {
        name: { type: DataTypes.STRING, allowNull: false },
        thumbnail: { type: DataTypes.STRING, allowNull: true },
        json: { type: DataTypes.JSON, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: true },
        isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
        createdBy: { type: DataTypes.INTEGER, allowNull: false }
    }, {
        tableName: `userOccupiedAssets`,
    });
    userOccupiedAssets.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return userOccupiedAssets;
}

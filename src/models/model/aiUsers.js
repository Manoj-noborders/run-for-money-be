const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const aiUsers = sequelize.define('aiUsers', {
        name: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        userType: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
        userInfo: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 4 }, // 1: xana; 2: xanalia; 3: tcg; 4: rfm
        aiStatus: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        role: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, validate: { isIn: [[1, 2, 3, 4, 5]] } }, // 1. Admin 2.User 3. Not sure 4. AI
        isHaveMinFuel: { type: DataTypes.BOOLEAN, defaultValue: false },
        isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
        deletedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    }, {
        tableName: `${pkg.name}_aiUsers`,
        paranoid: true,
    });
    aiUsers.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    };
    return aiUsers;
};

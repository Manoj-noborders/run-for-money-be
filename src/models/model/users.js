module.exports = (sequelize, DataTypes) => {
    const users = sequelize.define('users', {
        name: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        dob: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        phoneNumber: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        userType: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
        userInfo: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 4 }, // 1: xana; 2: xanalia; 3: tcg; 4: rfm
        walletAddress: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        nonce: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        email: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        avatar: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        tcgAvatar: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        password: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        aiStatus: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        role: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2, validate: { isIn: [[1, 2, 3, 4, 5]] } }, // 1: Admin; 2: User; 3: Not_Sure; 4: AI; 5: RFM_AI
        coins: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0.00 },
        isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        isHaveMinFuel: { type: DataTypes.BOOLEAN, defaultValue: false },
        isRegister: { type: DataTypes.BOOLEAN, defaultValue: false },
        isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
        cryptoEmailVerify: { type: DataTypes.BOOLEAN, defaultValue: false },
        tcg_first_login: { type: DataTypes.BOOLEAN, defaultValue: true },
        profileIconColor: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        deletedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        rfm_first_login: { type: DataTypes.BOOLEAN, defaultValue: true },
        profilePicUrl: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    }, {
        paranoid: true,
    });
    users.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    };
    return users;
};



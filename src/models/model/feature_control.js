module.exports = (sequelize, DataTypes) => {
    const features_control = sequelize.define('features_control', {
        feature_name: { type: DataTypes.STRING, unique: true, allowNull: false },
        feature_status: { type: DataTypes.BOOLEAN, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }, {
        tableName: 'nftduel_nftduel_features_control',
        timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at'
    });
    features_control.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return features_control;
};

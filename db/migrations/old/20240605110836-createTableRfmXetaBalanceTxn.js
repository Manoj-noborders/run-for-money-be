'use strict';
module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable("rfm_xeta_balance_txn", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userWallet: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      txnHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },
  down: function (queryInterface, DataTypes) {
    return queryInterface.dropTable("rfm_xeta_balance_txn");
  },
};

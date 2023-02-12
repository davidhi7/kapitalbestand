import { DataTypes } from 'sequelize';

export default (sequelize) => {
    return sequelize.define('Transaction', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        amount: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        isExpense: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {
        timestamps: false,
    });
};

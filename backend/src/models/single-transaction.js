import { DataTypes } from 'sequelize';

export default (sequelize) => {
    return sequelize.define('SingleTransaction', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
    });
};

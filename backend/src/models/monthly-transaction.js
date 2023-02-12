import { DataTypes } from 'sequelize';

export default (sequelize) => {
    return sequelize.define('MonthlyTransaction', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        monthFrom: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        monthTo: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        }
    });
};

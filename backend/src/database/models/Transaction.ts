import { DataTypes, Model, Sequelize } from 'sequelize';

class Transaction extends Model {
    declare isExpense: boolean;
    declare amount: Number;
    declare description: string;
}

export default function init(sequelize: Sequelize) {
    return Transaction.init(
        {
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
        },
        {
            sequelize,
            modelName: 'Transaction'
        }
    );
}

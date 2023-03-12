import { DataTypes, Model, Sequelize } from 'sequelize';

class OneoffTransaction extends Model {
    declare date: Date;
    declare Transaction: {
        isExpense: boolean;
        amount: number;
        description: string;
    };
}

export default function init(sequelize: Sequelize) {
    return OneoffTransaction.init(
        {
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'OneoffTransaction'
        }
    );
}

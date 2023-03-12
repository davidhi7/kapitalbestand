import { DataTypes, Model, Sequelize } from 'sequelize';

class MonthlyTransaction extends Model {
    // TODO custom month value
    declare monthFrom: Date;
    declare monthTo: Date | null;
}

export default function init(sequelize: Sequelize) {
    return MonthlyTransaction.init(
        {
            monthFrom: {
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            monthTo: {
                type: DataTypes.DATEONLY,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'MonthlyTransaction',
        }
    );
}

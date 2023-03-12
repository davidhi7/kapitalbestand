import { DataTypes, Model, Sequelize } from 'sequelize';

class OneoffTransaction extends Model {
    declare date: Date;
}

export default function init(sequelize: Sequelize) {
    return OneoffTransaction.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
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

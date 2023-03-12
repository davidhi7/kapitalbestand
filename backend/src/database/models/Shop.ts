import { DataTypes, Model, Sequelize } from 'sequelize';

class Shop extends Model {
    declare name: string;
}

export default function init(sequelize: Sequelize) {
    return Shop.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            }
        },
        {
            sequelize,
            modelName: 'Shop'
        }
    );    
}

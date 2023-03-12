import { DataTypes, Model, Sequelize } from 'sequelize';

class Category extends Model {
    declare name: string;
}

export default function init(sequelize: Sequelize) {
    return Category.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            }
        },
        {
            sequelize,
            modelName: 'Category'
        }
    );
}

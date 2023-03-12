import { DataTypes, Model, Sequelize } from 'sequelize';

class User extends Model {
    declare username: string;
    declare hash: string;
}

export default function init(sequelize: Sequelize) {
    return User.init(
        {
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            hash: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, 
        {
            sequelize,
            modelName: 'User',
            defaultScope: {
                attributes: {
                    exclude: ['hash']
                }
            },
            scopes: {
                with_hash: {
                    attributes: {
                        exclude: []
                    }
                }   
            }
        }
    );
}

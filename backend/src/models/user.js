import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        hash: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
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
    });
};

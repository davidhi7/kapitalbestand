import {
    AllowNull,
    Column,
    CreatedAt,
    DefaultScope,
    Model,
    Scopes,
    Table,
    Unique,
    UpdatedAt
} from 'sequelize-typescript';

@DefaultScope(() => ({
    attributes: {
        exclude: ['hash']
    }
}))
@Scopes(() => ({
    with_hash: {
        attributes: {
            exclude: []
        }
    }
}))
@Table
export default class User extends Model {
    declare id: number;

    @AllowNull(false)
    @Unique
    @Column
    declare username: string;

    @AllowNull(false)
    @Column
    declare hash: string;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}

import {
    AllowNull,
    BelongsTo,
    Column,
    CreatedAt,
    ForeignKey,
    Model,
    Table,
    UpdatedAt
} from 'sequelize-typescript';

import Transaction from './Transaction.js';
import User from './User.js';

@Table
export default class Shop extends Model {
    declare id: number;

    @AllowNull(false)
    @Column
    declare name: string;

    @ForeignKey(() => User)
    @AllowNull(false)
    @Column
    declare UserId: number;

    @BelongsTo(() => User)
    declare User: ReturnType<() => User>;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}

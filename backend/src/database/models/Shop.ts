import {
    AllowNull,
    BelongsTo,
    Column,
    ForeignKey,
    HasMany,
    Model,
    Table,
    Unique
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

    @HasMany(() => Transaction)
    declare Transactions: Transaction[];

    @BelongsTo(() => User)
    declare User: ReturnType<() => User>;
}

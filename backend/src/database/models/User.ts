import {
    AllowNull,
    Column,
    DefaultScope,
    HasMany,
    Model,
    Scopes,
    Table,
    Unique
} from 'sequelize-typescript';

import Category from './Category.js';
import MonthlyTransaction from './MonthlyTransaction.js';
import OneoffTransaction from './OneoffTransaction.js';
import Shop from './Shop.js';

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

    @HasMany(() => Category)
    declare Categories: Category[];

    @HasMany(() => Shop)
    declare Shops: Shop[];

    @HasMany(() => OneoffTransaction)
    declare OneoffTransactions: OneoffTransaction[];

    @HasMany(() => MonthlyTransaction)
    declare MonthlyTransactions: MonthlyTransaction[];
}

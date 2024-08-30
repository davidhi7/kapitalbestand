import {
    AllowNull,
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    DefaultScope,
    ForeignKey,
    Model,
    Table,
    UpdatedAt
} from 'sequelize-typescript';

import Category from './Category.js';
import Shop from './Shop.js';
import Transaction from './Transaction.js';
import User from './User.js';

@DefaultScope(() => ({
    include: [
        {
            model: Transaction,
            include: [Category, Shop]
        }
    ]
}))
@Table
export default class OneoffTransaction extends Model {
    declare id: number;

    @AllowNull(false)
    @Column(DataType.DATEONLY)
    declare date: string;

    @ForeignKey(() => User)
    @AllowNull(false)
    @Column
    declare UserId: number;

    @BelongsTo(() => User)
    declare User: ReturnType<() => User>;

    @ForeignKey(() => Transaction)
    @Column
    declare TransactionId: number;

    @BelongsTo(() => Transaction)
    declare Transaction: ReturnType<() => Transaction>;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}

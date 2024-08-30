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

@DefaultScope(() => ({
    include: [Category, Shop]
}))
@Table
export default class Transaction extends Model {
    declare id: number;

    @AllowNull(false)
    @Column
    declare isExpense: boolean;

    @AllowNull(false)
    @Column
    declare amount: number;

    @AllowNull(true)
    @Column(DataType.TEXT)
    declare description: string;

    @ForeignKey(() => Category)
    @AllowNull(false)
    @Column
    declare CategoryId: number;

    @BelongsTo(() => Category)
    declare Category: ReturnType<() => Category>;

    @ForeignKey(() => Shop)
    @AllowNull(true)
    @Column
    declare ShopId: number;

    @BelongsTo(() => Shop)
    declare Shop: ReturnType<() => Shop>;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}

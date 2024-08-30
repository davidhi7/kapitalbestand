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
export default class MonthlyTransaction extends Model {
    declare id: number;

    @AllowNull(false)
    @Column(DataType.DATEONLY)
    get monthFrom() {
        let [year, month] = this.getDataValue('monthFrom').split('-');
        return `${year}-${month}`;
    }

    set monthFrom(value: string) {
        let [year, month] = value.split('-');

        this.setDataValue('monthFrom', `${year}-${month}`);
    }

    @AllowNull(true)
    @Column(DataType.DATEONLY)
    get monthTo() {
        let value = this.getDataValue('monthTo');
        if (value === null) {
            return null;
        }
        let [year, month] = value.split('-');
        return `${year}-${month}`;
    }

    set monthTo(value: string | null) {
        let new_value = null;
        if (value) {
            let [year, month] = value.split('-');
            new_value = `${year}-${month}`;
        }

        this.setDataValue('monthTo', new_value);
    }

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

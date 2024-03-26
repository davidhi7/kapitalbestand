import { DataTypes, QueryInterface } from 'sequelize';

export async function up({ context }: { context: QueryInterface }) {
    for (let tableName of ['Categories', 'Shops', 'OneoffTransactions', 'MonthlyTransactions']) {
        await context.changeColumn(tableName, 'UserId', {
            type: DataTypes.INTEGER,
            allowNull: false
        });
    }
    await context.changeColumn('Transactions', 'CategoryId', {
        type: DataTypes.INTEGER,
        allowNull: false
    });
    await context.changeColumn('Transactions', 'ShopId', {
        type: DataTypes.INTEGER,
        allowNull: false
    });
}

export async function down({ context }: { context: QueryInterface }) {
    for (let tableName of ['Categories', 'Shops', 'OneoffTransactions', 'MonthlyTransactions']) {
        await context.changeColumn(tableName, 'UserId', {
            type: DataTypes.INTEGER,
            allowNull: true
        });
    }
    await context.changeColumn('Transactions', 'CategoryId', {
        type: DataTypes.INTEGER,
        allowNull: true
    });
    await context.changeColumn('Transactions', 'ShopId', {
        type: DataTypes.INTEGER,
        allowNull: true
    });
}

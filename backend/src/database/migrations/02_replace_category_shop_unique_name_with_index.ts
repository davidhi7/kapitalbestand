import { QueryInterface } from 'sequelize';

export async function up({ context }: { context: QueryInterface }) {
    await context.removeConstraint('Categories', 'Categories_name_key');
    await context.removeConstraint('Shops', 'Shops_name_key');
    await context.addIndex('Categories', {
        fields: ['name', 'UserId'],
        unique: true,
        name: 'Categories_name__user_id'
    });
    await context.addIndex('Shops', {
        fields: ['name', 'UserId'],
        unique: true,
        name: 'Shops_name__user_id'
    });
}

export async function down({ context }: { context: QueryInterface }) {
    await context.addConstraint('Categories', {
        type: 'unique',
        fields: ['name'],
        name: 'Categories_name_key'
    });
    await context.addConstraint('Shops', {
        type: 'unique',
        fields: ['name'],
        name: 'Shops_name_key'
    });
    await context.removeIndex('Categories', 'Categories_name__user_id');
    await context.removeIndex('Shops', 'Shops_name__user_id');
}

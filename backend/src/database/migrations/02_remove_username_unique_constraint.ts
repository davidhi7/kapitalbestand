import { QueryInterface } from 'sequelize';

export async function up({ context }: { context: QueryInterface }) {
    await context.removeConstraint('Users', 'Users_username_key');
}

export async function down({ context }: { context: QueryInterface }) {
    await context.addConstraint('Users', {
        type: 'unique',
        fields: ['username'],
        name: 'Users_username_key'
    });
}

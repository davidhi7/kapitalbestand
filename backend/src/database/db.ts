import { Sequelize } from 'sequelize-typescript';

import config from '../config.js';
import Category from './models/Category.js';
import MonthlyTransaction from './models/MonthlyTransaction.js';
import OneoffTransaction from './models/OneoffTransaction.js';
import Shop from './models/Shop.js';
import Transaction from './models/Transaction.js';
import User from './models/User.js';

let sequelize: Sequelize | undefined = undefined;

export async function connectToDatabase() {
    if (sequelize != undefined) {
        console.log('Database connection was already established');
        return sequelize;
    }
    sequelize = new Sequelize({
        ...config.db,
        models: [Category, Shop, Transaction, MonthlyTransaction, OneoffTransaction, User]
    });

    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database');
        console.error(error);
        throw error;
    }

    return sequelize;
}

export default sequelize;
export { Category, MonthlyTransaction, OneoffTransaction, Shop, Transaction, User };

import { Model, Sequelize } from 'sequelize';
import {
    user,
    transaction,
    singleTransaction,
    monthlyTransaction,
    category,
    shop,
    associations
} from '../models/index.js';
import config from '../config.js';

const sequelize = new Sequelize(config.db);

try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

const User = user(sequelize);
const Transaction = transaction(sequelize);
const SingleTransaction = singleTransaction(sequelize);
const MonthlyTransaction = monthlyTransaction(sequelize);
const Category = category(sequelize);
const Shop = shop(sequelize);

associations(sequelize);

// todo replace with migrate script and test hooks
await sequelize.sync({ force: false });

export default sequelize;
export { User, Transaction, SingleTransaction, MonthlyTransaction, Category, Shop };

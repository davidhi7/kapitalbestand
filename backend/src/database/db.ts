import { Model, Sequelize } from 'sequelize';

import config from '../config.js';
import initCategories from './models/Category.js';
import initMonthlyTransactions from './models/MonthlyTransaction.js';
import initOneoffTransactions from './models/OneoffTransaction.js';
import initShops from './models/Shop.js';
import initTransactions from './models/Transaction.js';
import initUsers from './models/User.js';
import setAssociations from './models/associations.js';

const sequelize = new Sequelize(config.db);

try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

const Category = initCategories(sequelize);
const MonthlyTransaction = initMonthlyTransactions(sequelize);
const OneoffTransaction = initOneoffTransactions(sequelize);
const Shop = initShops(sequelize);
const Transaction = initTransactions(sequelize);
const User = initUsers(sequelize);

setAssociations(sequelize);

// TODO: replace with migrate script and test hooks
await sequelize.sync({ force: false });

export default sequelize;
export { User, Category, Shop, Transaction, OneoffTransaction, MonthlyTransaction };

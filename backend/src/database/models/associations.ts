import { Sequelize } from 'sequelize';

export default function setAssociations(sequelize: Sequelize) {
    const { Transaction, Category, Shop, OneoffTransaction, MonthlyTransaction, User } = sequelize.models;
    
    const inhibitNullKey = { foreignKey: { allowNull: false }};
    
    Transaction.belongsTo(Category, inhibitNullKey);
    Transaction.belongsTo(Shop);
    Category.hasMany(Transaction);
    Shop.hasMany(Transaction);

    OneoffTransaction.belongsTo(Transaction, inhibitNullKey);
    OneoffTransaction.belongsTo(User, inhibitNullKey);
    Transaction.hasMany(OneoffTransaction);
    User.hasMany(OneoffTransaction);

    MonthlyTransaction.belongsTo(Transaction, inhibitNullKey);
    MonthlyTransaction.belongsTo(User, inhibitNullKey);
    Transaction.hasMany(MonthlyTransaction);
    User.hasMany(MonthlyTransaction);

    Category.belongsTo(User, inhibitNullKey);
    Shop.belongsTo(User, inhibitNullKey);
    User.hasMany(Category);
    User.hasMany(Shop);

    MonthlyTransaction.addScope('defaultScope', {
        include: [
            {
                model: Transaction,
                include: [ Category, Shop ]
            }
        ]
    });
    OneoffTransaction.addScope('defaultScope', {
        include: [
            {
                model: Transaction,
                include: [ Category, Shop ]
            }
        ]
    });
};

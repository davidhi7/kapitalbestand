export default (sequelize) => {
    const { Transaction, Category, Shop, SingleTransaction, MonthlyTransaction, User } = sequelize.models;
    
    const inhibitNullKey = { foreignKey: { allowNull: false }};
    
    Transaction.belongsTo(Category, inhibitNullKey);
    Transaction.belongsTo(Shop);
    Category.hasMany(Transaction);
    Shop.hasMany(Transaction);

    SingleTransaction.belongsTo(Transaction, inhibitNullKey);
    SingleTransaction.belongsTo(User, inhibitNullKey);
    Transaction.hasMany(SingleTransaction);
    User.hasMany(SingleTransaction);

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
    SingleTransaction.addScope('defaultScope', {
        include: [
            {
                model: Transaction,
                include: [ Category, Shop ]
            }
        ]
    });
};

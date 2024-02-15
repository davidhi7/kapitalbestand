import { InferAttributes } from 'sequelize';

import { Category as CategoryClass, Shop as ShopClass } from '../database/db.js';

type Category = Omit<InferAttributes<CategoryClass>, 'Transactions' | 'User'>;
type Shop = Omit<InferAttributes<ShopClass>, 'Transactions' | 'User'>;

export { Category, Shop };

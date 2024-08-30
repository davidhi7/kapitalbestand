import { Op } from 'sequelize';

import { User } from '../../database/db.js';
import { BaseFetchParameters } from '../types.js';
import { MonthlyTransactionQueryParameters } from './MonthlyTransactionController.js';
import { OneoffTransactionQueryParameters } from './OneoffTransactionController.js';

/**
 * Build where conditions for querying one-off or monthly transactions with optional attributes.
 * @param {*} user Sequelize user instance
 * @param {*} attributes List of provided attributes that are part of: [ dateLimit, amountLimit, monthLimit, categoryId, shopId ],
 * where dateLimit, amountLimit and monthLimit are arrays of a length of 2 containing the lowre and upper limit, respectively.
 * Its first and second value is the lower and upper limit, respectively.
 * @returns nested 'where' conditions object for use in Sequelize query.
 * @throws Error on invalid combination of attributes
 */
export const buildWhereConditions = (
    user: User,
    attributes: Omit<
        OneoffTransactionQueryParameters & MonthlyTransactionQueryParameters,
        keyof BaseFetchParameters
    >
) => {
    let {
        dateFrom,
        dateTo,
        monthFrom,
        monthTo,
        amountFrom,
        amountTo,
        CategoryId,
        ShopId,
        isExpense
    } = attributes;
    const whereConditions: Record<string, string | number | boolean | Record<symbol, any>> = {};

    whereConditions['UserId'] = user.id;

    // handle date limits for one-off transactions
    if (dateFrom || dateTo) {
        whereConditions['date'] = {} as Record<symbol, string>;
        if (dateFrom) {
            whereConditions['date'][Op.gte] = dateFrom;
        }
        if (dateTo) {
            whereConditions['date'][Op.lte] = dateTo;
        }
    }

    /*
    Handle month limits for monthly transactions. Note that monthly transactions have a monthFrom and monthTo attributes, the latter being optional.
    MonthTo being null in the DB represents a monthly transaction without already known end, so monthTo must either be lte to the given upper limit OR null.
    */
    if (monthFrom || monthTo) {
        if (monthFrom && monthTo && new Date(monthFrom) > new Date(monthTo)) {
            throw new Error('Invalid combination of `monthFrom` and `monthTo` values');
        }
        if (monthFrom) {
            /*
            If monthFrom is given, relevant instances have either:
            1. monthTo = null, meaning the recurrent transaction doesn't stop at some month, or
            2. monthTo > given monthFrom, meaning the recurrent transaction doesn't stop before the given start month
            */
            whereConditions['monthTo'] = {} as Record<symbol, string>;
            whereConditions['monthTo'][Op.or] = {
                [Op.eq]: null,
                [Op.gte]: monthFrom
            };
        }
        if (monthTo) {
            // If monthTo is given, relevant instances must have a monthForm < given monthTo, meaning relevant transactions start before the given stop month
            whereConditions['monthFrom'] = {} as Record<symbol, string>;
            whereConditions['monthFrom'][Op.lte] = monthTo;
        }
    }
    if (monthTo === null) {
        // If monthTo is explicitely null, then only search for transactions that match this requirement
        // Also overwrite any previous entries by the code above
        whereConditions['monthTo'] = {} as Record<symbol, string>;
        whereConditions['monthTo'][Op.eq] = null;
    }

    // handle amount limits
    if (amountFrom || amountTo) {
        whereConditions['$Transaction.amount$'] = {} as Record<symbol, string>;

        if (amountFrom !== undefined) {
            whereConditions['$Transaction.amount$'][Op.gte] = amountFrom;
        }
        if (amountTo !== undefined) {
            whereConditions['$Transaction.amount$'][Op.lte] = amountTo;
        }
    }

    // handle CategoryId, ShopId and isExpense
    if (CategoryId !== undefined) {
        whereConditions['$Transaction.CategoryId$'] = CategoryId;
    }
    if (ShopId !== undefined) {
        whereConditions['$Transaction.ShopId$'] = ShopId;
    }
    if (isExpense !== undefined) {
        whereConditions['$Transaction.isExpense$'] = isExpense;
    }

    return { [Op.and]: whereConditions };
};

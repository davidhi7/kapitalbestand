import { Op } from 'sequelize';

/**
 * Build where conditions for querying one-off or monthly transactions with optional attributes.
 * @param {*} user Sequelize user instance
 * @param {*} attributes List of provided attributes that are part of: [ dateLimit, amountLimit, monthLimit, categoryId, shopId ],
 * where dateLimit, amountLimit and monthLimit are arrays of a length of 2 containing the lowre and upper limit, respectively.
 * Its first and second value is the lower and upper limit, respectively.
 * @returns nested 'where' conditions object for use in Sequelize query.
 */
export const buildWhereConditions = (user, attributes = {}) => {
    const { dateLimit, monthLimit, amountLimit, CategoryId, ShopId, isExpense } = attributes;
    const whereConditions = {};

    whereConditions['UserId'] = user.id;

    // handle date limits for one-off transactions
    if (dateLimit && (dateLimit[0] || dateLimit[1])) {
        const dateConditions = {};
        const dateFrom = dateLimit[0];
        const dateTo = dateLimit[1];
        if (dateFrom !== undefined) {
            dateConditions[Op.gte] = dateFrom;
        }
        if (dateTo !== undefined) {
            dateConditions[Op.lte] = dateTo;
        }
        whereConditions['date'] = dateConditions;
    }

    /*
    Handle month limits for monthly transactions. Note that monthly transactions have a monthFrom and monthTo attributes, the latter being optional.
    MonthTo being null in the DB represents a monthly transaction without already known end, so monthTo must either be lte to the given upper limit OR null.
    */
    if (monthLimit) {
        const monthFrom = monthLimit[0];
        const monthTo = monthLimit[1];
        // little hack to yield no query results when monthFrom > monthTo
        // TODO: if possible, clean up
        if (monthFrom && monthTo && new Date(monthFrom) > new Date(monthTo)) {
            whereConditions['monthFrom'] = {
                [Op.gte]: monthFrom
            };
            whereConditions['monthTo'] = {
                [Op.lte]: monthTo
            };
        } else {
            if (monthFrom !== undefined) {
                whereConditions['monthFrom'] = {
                    [Op.gte]: monthFrom
                };
            } else if (monthTo != null) {
                /*
                If monthTo value is given, instances with monthTo == null are included (see below).
                This also includes instance with monthFrom values later than the given monthTo limit.
                To exclude such falsely included instances that are not actually within the bounds, we use this second required condition:
                The instance monthFrom value must be earlier or equal to the given monthTo value.
                */
                whereConditions['monthFrom'] = {
                    [Op.lte]: monthTo
                };
            }
            if (monthTo !== undefined) {
                whereConditions['monthTo'] = {
                    [Op.or]: {
                        [Op.eq]: null,
                        [Op.gte]: monthTo
                    }
                };
            }
        }
    }

    // handle amount limits
    if (amountLimit && (amountLimit[0] || amountLimit[1])) {
        const amountConditions = {};
        const amountFrom = amountLimit[0];
        const amountTo = amountLimit[1];
        if (amountFrom !== undefined) {
            amountConditions[Op.gte] = amountFrom;
        }
        if (amountTo !== undefined) {
            amountConditions[Op.lte] = amountTo;
        }
        whereConditions['$Transaction.amount$'] = amountConditions;
    }

    // handle categoryId, shopId and isExpense
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

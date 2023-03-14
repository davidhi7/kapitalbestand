import express from 'express';

import authentication from './authentication.js';
import analysis from './endpoints/analysis.js';
import categories from './endpoints/categories.js';
import shops from './endpoints/shops.js';
import transactions from './endpoints/transactions.js';
import { errorHandler } from './error-handling.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.use(authentication);

router.use('/transactions', transactions);
router.use('/categories', categories);
router.use('/shops', shops);
router.use('/analysis', analysis);

router.use(errorHandler);

export default router;

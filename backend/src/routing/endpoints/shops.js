import express from 'express';

import { shopController } from '../../controllers/category-shop/AuxDataController.js';
import { asyncEndpointWrapper } from '../error-handling.js';
import ResponseBuilder from '../response-builder.js';

const router = express.Router();

router.get('/names', (req, res, next) => {
    asyncEndpointWrapper(req, res, next, async () => {
        res.json(
            ResponseBuilder({
                status: 'success',
                data: await shopController.fetchNames(req.session.user)
            })
        );
    });
});

export default router;

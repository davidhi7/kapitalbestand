import express from 'express';
import { param } from 'express-validator';

import AnalysisController from '../../controllers/transaction/AnalysisController.js';
import { asyncEndpointWrapper } from '../error-handling.js';
import ResponseBuilder from '../response-builder.js';

const router = express.Router();

router.get(
    '/year/:year',
    param('year').isInt().toInt(),
    (req: express.Request, res: express.Response, next) => {
        asyncEndpointWrapper(req, res, next, async () => {
            res.json(
                ResponseBuilder({
                    status: 'success',
                    // @ts-expect-error: `req.params.year` is already converted to a number by express-validator
                    data: await AnalysisController.getYearlyStatistics(
                        req.session.user,
                        req.params.year
                    )
                })
            );
        });
    }
);

export default router;

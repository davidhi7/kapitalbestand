import express from 'express';
import morgan from 'morgan';
import { AddressInfo } from 'node:net';
import path from 'node:path';

import config from './config.js';
import router from './routing/api.js';

const app = express();
app.disable('x-powered-by');
app.use(morgan('common'));

app.use('/api', router);

// Allow routing for the SPA on production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(config.paths.static_directory));
    app.get('*', (req, res) => res.sendFile(path.resolve('static/index.html')));
}

const server = app.listen(8080, () => {
    const { address, port } = server.address() as AddressInfo;
    console.log('HTTP Server listening at %s:%s', address, port);
});

process.on('SIGTERM', () => {
    console.debug('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.debug('HTTP server closed');
    });
});

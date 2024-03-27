import { expect } from 'chai';
import express from 'express';
import request from 'supertest';

import { User } from '../database/db.js';
import auth from './authentication.js';
import { errorHandler } from './error-handling.js';

describe('authentication middlewares', () => {
    const app = express();
    app.use(express.json());
    app.use('/api', auth);
    app.use(errorHandler);

    async function register_test_account(username = 'test') {
        const password = '12345678';

        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: username, password: password });
        // Extract the session id key value pair:
        // `set-cookie` is an array of cookies. We pick the first string assuming that there is only one cookie set.
        // This string contains the key value pair but also additional values like http only property or cookie max age. The session id is the first component before any semicolons.
        const sessionId = res.headers['set-cookie'][0].split(';')[0];
        const sessionTimeout = res.body.data.sessionTimeout;

        return { username, password, sessionId, sessionTimeout };
    }

    describe('general behaviour', () => {
        it('should not return a session id if the user is not logged in to prevent session fixations', async () => {
            const res = await request(app).post('/api/auth/whoami').send();
            expect(res.headers['set-cookie']).to.be.undefined;
        });
    });
    describe('/auth/register', () => {
        it('should allow to create a new user, returning the new username and session id and set a session id cookie', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'auth-test-user', password: '12345678Ab_' });

            expect(res.status).to.equal(201);
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.data.sessionTimeout).to.be.lessThanOrEqual(Date.now() + 1000 * 60 * 60);
            expect(res.body).to.deep.equal({
                status: 'success',
                data: { username: 'auth-test-user', sessionTimeout: res.body.data.sessionTimeout }
            });
            expect(res.headers['set-cookie']).to.be.lengthOf(1);
            // expect two because one default user does already exist
            expect(await User.count()).to.equal(2);
            expect(await User.findAll({ where: { username: 'auth-test-user' } })).to.be.of.length(
                1
            );
        });
        it('should fail to create a new user if the password does not match the minimum length of 8', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'auth-test-user', password: '1234567' });

            expect(res.status).to.equal(400);
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body).to.deep.equal({
                status: 'error',
                error: 'Bad request on endpoint POST /api/auth/register',
                data: {
                    errors: [
                        {
                            value: '1234567',
                            msg: 'Invalid value',
                            param: 'password',
                            location: 'body'
                        }
                    ]
                }
            });
            expect(await User.count()).to.equal(1);
        });
        it('should fail to create a new user if the username is already taken', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({ username: 'auth-test-user', password: '12345679010' });
            expect(await User.count()).to.equal(2);
            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'auth-test-user', password: '123456790' });

            expect(res.status).to.equal(403);
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body).to.deep.equal({
                status: 'error',
                error: 'Forbidden'
            });
            expect(await User.count()).to.equal(2);
        });
        it('should fail if no username is provided', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ password: '123456790' });

            expect(res.status).to.equal(400);
            expect(res.headers['content-type']).to.match(/json/);
            expect(await User.count()).to.equal(1);
        });
        it('should fail if no password is provided', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'auth-test-user' });

            expect(res.status).to.equal(400);
            expect(res.headers['content-type']).to.match(/json/);
            expect(await User.count()).to.equal(1);
        });
        it('should change the session id if an already registered user registers again, thus changing the logged-in account', async () => {
            const { sessionId: firstSessionId } = await register_test_account('test1');
            const { sessionId: secondSessionId } = await register_test_account('test2');
            expect(firstSessionId).not.to.equal(secondSessionId);
        });
    });
    describe('/auth/login', () => {
        it('should successfully login and return the username and session id on success', async () => {
            const user_data = { username: 'auth-test-user', password: '12345678' };
            await request(app).post('/api/auth/register').send(user_data);
            const res = await request(app).post('/api/auth/login').send(user_data);
            expect(res.status).to.equal(200);
            expect(res.body.data.sessionTimeout).to.be.lessThanOrEqual(Date.now() + 1000 * 60 * 60);
            expect(res.body).to.deep.equal({
                status: 'success',
                data: { username: 'auth-test-user', sessionTimeout: res.body.data.sessionTimeout }
            });
            expect(res.headers['set-cookie']).to.be.lengthOf(1);
        });
        it('should fail to login on wrong username', async () => {
            const user_data = { username: 'auth-test-user', password: '12345678' };
            await request(app).post('/api/auth/register').send(user_data);
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'wrong', password: '12345678' });
            expect(res.status).to.equal(403);
            expect(res.body).to.deep.equal({
                status: 'error',
                error: 'Forbidden'
            });
        });
        it('should fail to login on wrong password', async () => {
            const user_data = { username: 'auth-test-user', password: '12345678' };
            await request(app).post('/api/auth/register').send(user_data);
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'auth-test-user', password: 'wrong' });
            expect(res.status).to.equal(403);
            expect(res.body).to.deep.equal({
                status: 'error',
                error: 'Forbidden'
            });
        });
        it('should fail if no username is provided', async () => {
            const res = await request(app).post('/api/auth/login').send({ password: '123456790' });

            expect(res.status).to.equal(400);
            expect(res.headers['content-type']).to.match(/json/);
            expect(await User.count()).to.equal(1);
        });
        it('should fail if no password is provided', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'auth-test-user' });

            expect(res.status).to.equal(400);
            expect(res.headers['content-type']).to.match(/json/);
            expect(await User.count()).to.equal(1);
        });
        it('should change the session id if an already registered user logs in again, thus changing the logged-in account', async () => {
            const { username, password } = await register_test_account('test1');
            const { sessionId: firstSessionId } = await register_test_account('test2');
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ username, password });
            const secondSessionId = loginResponse.headers['set-cookie'][0].split(';')[0];

            expect(firstSessionId).not.to.equal(secondSessionId);
        });
    });
    describe('/auth/whoami', async () => {
        it('should return username and session timeout if the user is authenticated', async () => {
            const { username, sessionId, sessionTimeout } = await register_test_account();
            const res = await request(app)
                .get('/api/auth/whoami')
                .set('Cookie', [sessionId])
                .expect(200);

            expect(res.body.data.username).to.equal(username);
            expect(res.body.data.sessionTimeout).to.be.greaterThanOrEqual(sessionTimeout);
        });
        it('should fail if the user is not authenticated', async () => {
            await request(app).get('/api/auth/whoami').expect(401, {
                status: 'error',
                error: 'Unauthorized'
            });
        });
    });
    describe('/auth/logout', () => {
        it('should logout if the user is authenticated', async () => {
            const { sessionId } = await register_test_account();

            await request(app)
                .get('/api/auth/logout')
                .set('Cookie', [sessionId])
                .expect(200, { status: 'success' });
            await request(app).get('/api/auth/whoami').expect(401, {
                status: 'error',
                error: 'Unauthorized'
            });
        });
        it('should fail if the user is not authenticated', async () => {
            await request(app).get('/api/auth/whoami').expect(401, {
                status: 'error',
                error: 'Unauthorized'
            });
        });
    });
    describe('/auth/refresh', () => {
        it('should refresh the session and reset the timeout if the user is authenticated', async () => {
            const { sessionId, sessionTimeout } = await register_test_account();

            const res = await request(app).get('/api/auth/refresh').set('Cookie', [sessionId]);
            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expect(res.body.data.username).to.equal('test');
            expect(res.body.data.sessionTimeout).to.be.greaterThan(sessionTimeout);
        });
        it('should fail if the user is not authenticated', async () => {
            await request(app).get('/api/auth/refresh').expect(401, {
                status: 'error',
                error: 'Unauthorized'
            });
        });
    });
});

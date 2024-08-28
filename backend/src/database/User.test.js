import { expect } from 'chai';

import { User } from './db.js';

describe('user model', function () {
    it('should not include the password hash on default query', async function () {
        const user = await User.findOne();
        expect(user.hash).to.be.undefined;
    });

    it('should include the password hash using the `with_hash` scope', async function () {
        const user = await User.scope('with_hash').findOne();
        expect(user.hash).to.not.be.undefined;
    });
});

import { expect } from 'chai';
import { User } from '../controllers/db.js';

describe('user model', () => {
    it('should not include the password hash on default query', async () => {
        User.create({
            username: 'testuser',
            hash: 'testhash'
        });
        const user = await User.findOne();
        expect(user.hash).to.be.undefined;
    });
    it('should include the password hash using the `with_hash` scope', async () => {
        User.create({
            username: 'testuser',
            hash: 'testhash'
        });
        const user = await User.scope('with_hash').findOne();
        expect(user.hash).to.not.be.undefined;
    });
});

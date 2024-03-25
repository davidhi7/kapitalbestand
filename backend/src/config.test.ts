import { expect } from 'chai';
import { writeFileSync } from 'fs';
import tmp from 'tmp';

import { readFromEnv } from './config.js';

describe('Environmental variables for docker secrets', () => {
    it('should return the correct value if the value is provided directly', () => {
        process.env.TEST_readFromEnv = 'test';
        expect(readFromEnv('TEST_readFromEnv')).to.equal('test');
        expect(readFromEnv('TEST_readFromEnv', true)).to.equal('test');
        delete process.env.TEST_readFromEnv;
    });
    it('should return the correct value if the value is provided within a file', () => {
        const tempFile = tmp.fileSync();
        writeFileSync(tempFile.fd, 'test-file');
        process.env.TEST_readFromEnv_FILE = tempFile.name;
        expect(readFromEnv('TEST_readFromEnv', true)).to.equal('test-file');
        delete process.env.TEST_readFromEnv_FILE;
    });
    it('should raise an error if no matching environmental variables are provided', () => {
        expect(() => readFromEnv('nonexisting_env')).to.throw(Error);
    });
});

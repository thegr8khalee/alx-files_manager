import { assert } from 'chai';
import sinon from 'sinon';
import redisClient from './utils/redis.js';

sinon.stub(console, 'log');

describe('redisClient test', () => {
  it('isAlive when redis not started', (done) => {
    let i = 0;
    const repeatFct = async () => {
      setTimeout(() => {
        let cResult;
        try {
          cResult = redisClient.isAlive();
        } catch (error) {
          cResult = false;
        }
        assert.isFalse(cResult);
        i += 1;
        if (i >= 5) {
          done();
        } else {
          repeatFct();
        }
      }, 1000);
    };
    repeatFct();
  }).timeout(10000);
});

/* global describe, it, expect, before */
/* jshint camelcase: false */

const chai = require('chai');
const token = require('../../lib/middleware/token');
const Server = require('../../lib/server');


describe('token', () => {
  it('should be named token', () => {
    const server = new Server();
    expect(token(server).name).to.equal('token');
  });

  it('should throw if constructed without a server argument', () => {
    expect(() => {
      token();
    }).to.throw(TypeError, 'oauth2orize.token middleware requires a server argument');
  });


  describe('exchanging a grant for an access token', () => {
    const server = new Server();

    server.exchange('authorization_code', (req, res, next) => {
      if (req.body.code !== 'abc123') { return done(new Error('incorrect req.body argument')); }
      const json = JSON.stringify({ token_type: 'bearer', access_token: 'aaa-111-ccc' });
      return res.end(json);
    });

    server.exchange('fubar', (req, res, next) => {
      next(new Error('something went wrong'));
    });


    describe('handling a request with supported grant', () => {
      let response;

      before((done) => {
        chai.connect.use(token(server))
          .req((req) => {
            req.body = { grant_type: 'authorization_code', code: 'abc123' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should respond', () => {
        expect(response.body).to.equal('{"token_type":"bearer","access_token":"aaa-111-ccc"}');
      });
    });

    describe('handling a request with unsupported grant type', () => {
      let err;

      before((done) => {
        chai.connect.use(token(server))
          .req((req) => {
            req.body = { grant_type: 'foo', code: 'abc123' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('TokenError');
        expect(err.message).to.equal('Unsupported grant type: foo');
        expect(err.code).to.equal('unsupported_grant_type');
      });
    });

    describe('encountering an error while exchanging grant', () => {
      let err;

      before((done) => {
        chai.connect.use(token(server))
          .req((req) => {
            req.body = { grant_type: 'fubar', code: 'abc123' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });
});

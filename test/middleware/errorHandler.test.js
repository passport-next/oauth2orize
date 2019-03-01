/* global describe, it, expect, before */
/* jshint expr: true */

const chai = require('chai');
const errorHandler = require('../../lib/middleware/errorHandler');
const AuthorizationError = require('../../lib/errors/authorizationerror');


describe('errorHandler', () => {
  it('should be named errorHandler', () => {
    expect(errorHandler().name).to.equal('errorHandler');
  });

  describe('direct mode', () => {
    describe('handling an error', () => {
      let res;

      before((done) => {
        chai.connect.use(errorHandler())
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(500);
        expect(res.getHeader('Content-Type')).to.equal('application/json');
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should set response body', () => {
        expect(res.body).to.equal('{"error":"server_error","error_description":"something went wrong"}');
      });
    });

    describe('handling an authorization error', () => {
      let res;

      before((done) => {
        chai.connect.use(errorHandler())
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('something went wrong', 'invalid_request'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(400);
        expect(res.getHeader('Content-Type')).to.equal('application/json');
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should set response body', () => {
        expect(res.body).to.equal('{"error":"invalid_request","error_description":"something went wrong"}');
      });
    });

    describe('handling an authorization error with URI', () => {
      let res;

      before((done) => {
        chai.connect.use(errorHandler())
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('something went wrong', 'invalid_request', 'http://example.com/errors/1'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(400);
        expect(res.getHeader('Content-Type')).to.equal('application/json');
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should set response body', () => {
        expect(res.body).to.equal('{"error":"invalid_request","error_description":"something went wrong","error_uri":"http://example.com/errors/1"}');
      });
    });
  }); // direct mode

  describe('indirect mode', () => {
    describe('handling an error', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an authorization error', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('not authorized', 'unauthorized_client'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an authorization error with URI', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an error with state', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { state: '1234' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong&state=1234');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an error using token response', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'token' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=server_error&error_description=something%20went%20wrong');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an authorization error using token response', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'token' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('not authorized', 'unauthorized_client'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=unauthorized_client&error_description=not%20authorized');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an authorization error with URI using token response', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'token' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an error with state using token response', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'token', state: '1234' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=server_error&error_description=something%20went%20wrong&state=1234');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an error using fragment encoding for extension response type', () => {
      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect', fragment: ['token', 'id_token'] }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'code id_token' };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=server_error&error_description=something%20went%20wrong');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an error with state using custom response mode', () => {
      const customResponseMode = function (txn, res, params) {
        expect(txn.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(params.error).to.equal('server_error');
        expect(params.error_description).to.equal('something went wrong');
        expect(params.state).to.equal('1234');

        res.redirect('/custom');
      };

      let res;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect', modes: { custom: customResponseMode } }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = {
              type: 'token', redirectURI: 'http://example.com/auth/callback', state: '1234', responseMode: 'custom',
            };
          })
          .end((r) => {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should set response headers', () => {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('/custom');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(res.body).to.be.undefined;
      });
    });

    describe('handling an error with state using unsupported response mode', () => {
      const customResponseMode = function (txn, res, params) {
        expect(txn.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(params.error).to.equal('server_error');
        expect(params.error_description).to.equal('something went wrong');
        expect(params.state).to.equal('1234');

        res.redirect('/custom');
      };

      let err;

      before((done) => {
        chai.connect.use('express', errorHandler({ mode: 'indirect', modes: { custom: customResponseMode } }))
          .req((req) => {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = {
              type: 'token', redirectURI: 'http://example.com/auth/callback', state: '1234', responseMode: 'fubar',
            };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should next with error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });

    describe('handling a request error without an OAuth 2.0 transaction', () => {
      let err;

      before((done) => {
        chai.connect.use(errorHandler({ mode: 'indirect' }))
          .next((e) => {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should next with error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });

    describe('handling a request error without a redirect URI', () => {
      let err;

      before((done) => {
        chai.connect.use(errorHandler({ mode: 'indirect' }))
          .req((req) => {
            req.oauth2 = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should next with error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  }); // indirect mode

  describe('unknown mode', () => {
    describe('handling an error', () => {
      let err;

      before((done) => {
        chai.connect.use(errorHandler({ mode: 'unknown' }))
          .next((e) => {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should next with error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  }); // unknown mode
});

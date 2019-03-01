const chai = require('chai');
const authorizationErrorHandler = require('../../lib/middleware/authorizationErrorHandler');
const Server = require('../../lib/server');


describe('authorizationErrorHandler', () => {
  it('should be named token', () => {
    const server = new Server();
    expect(authorizationErrorHandler(server).name).to.equal('authorizationErrorHandler');
  });

  it('should throw if constructed without a server argument', () => {
    expect(() => {
      authorizationErrorHandler();
    }).to.throw(TypeError, 'oauth2orize.authorizationErrorHandler middleware requires a server argument');
  });

  describe('using legacy transaction store', () => {
    let server;

    before(() => {
      server = new Server();

      server.grant('code', 'error', (err, txn, res, next) => {
        if (txn.req.scope != 'email') { return next(new Error('incorrect transaction argument')); }
        return res.redirect(`${txn.redirectURI}?error_description=${err.message}`);
      });

      server.grant('fubar', 'error', (err, txn, res, next) => next(new Error('something else went wrong')));
    });


    describe('handling an error', () => {
      let request; let
        response;

      before((done) => {
        chai.connect.use('express', authorizationErrorHandler(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error_description=something went wrong');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('handling an error when transaction has not been persisted', () => {
      let request; let
        response;

      before((done) => {
        chai.connect.use('express', authorizationErrorHandler(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error_description=something went wrong');
      });

      it('should not remove data from session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
      });
    });

    describe('handling an error where res.end has already been proxied', () => {
      let request; let
        response;

      before((done) => {
        chai.connect.use('express', authorizationErrorHandler(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
            req.oauth2._endProxied = true;
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error_description=something went wrong');
      });

      it('should not remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
      });
    });

    describe('encountering an unsupported response type while handling an error', () => {
      let request; let response; let
        err;

      before((done) => {
        chai.connect.use('express', authorizationErrorHandler(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'unsupported', scope: 'email' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should preserve error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });

    describe('encountering an error while handling an error', () => {
      let request; let response; let
        err;

      before((done) => {
        chai.connect.use('express', authorizationErrorHandler(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'fubar', scope: 'email' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something else went wrong');
      });
    });

    describe('handling a request that is not associated with a transaction', () => {
      let request; let response; let
        err;

      before((done) => {
        chai.connect.use('express', authorizationErrorHandler(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should preserve error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });

      it('should not remove data from session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
      });
    });
  });

  describe('using non-legacy transaction store', () => {
    let server;

    before(() => {
      const MockStore = require('../mock/store');
      server = new Server({ store: new MockStore() });

      server.grant('code', 'error', (err, txn, res, next) => {
        if (txn.req.scope != 'email') { return next(new Error('incorrect transaction argument')); }
        return res.redirect(`${txn.redirectURI}?error_description=${err.message}`);
      });
    });

    describe('handling an error', () => {
      let request; let
        response;

      before((done) => {
        chai.connect.use('express', authorizationErrorHandler(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = {};
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error_description=something went wrong');
      });

      it('should remove transaction', () => {
        expect(request.__mock_store__.removed).to.equal('abc123');
      });
    });
  });
});

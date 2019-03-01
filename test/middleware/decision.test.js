/* global describe, it, expect, before */
/* jshint expr: true, sub: true */

const chai = require('chai');
const decision = require('../../lib/middleware/decision');
const Server = require('../../lib/server');


describe('decision', () => {
  it('should be named decision', () => {
    const server = new Server();
    expect(decision(server).name).to.equal('decision');
  });

  it('should throw if constructed without a server argument', () => {
    expect(() => {
      decision();
    }).to.throw(TypeError, 'oauth2orize.decision middleware requires a server argument');
  });

  describe('using legacy transaction store', () => {
    let server;

    before(() => {
      server = new Server();
      server.grant('code', 'response', (txn, res, next) => {
        if (txn.transactionID !== 'abc123') { return next(new Error('incorrect transaction argument')); }

        if (txn.res.allow === false) { return res.redirect(`${txn.redirectURI}?error=access_denied`); }
        return res.redirect(`${txn.redirectURI}?code=a1b1c1`);
      });
    });

    describe('handling a user decision to allow access', () => {
      let request; let
        response;

      before((done) => {
        chai.connect.use('express', decision(server))
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
          .dispatch();
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });

      it('should flag req.end as proxied', () => {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });

    describe('handling a user decision to deny access', () => {
      let request; let
        response;

      before((done) => {
        chai.connect.use('express', decision(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = { cancel: 'Deny' };
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
          .dispatch();
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.false;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=access_denied');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('encountering an error while responding to request', () => {
      let server; let request; let response; let
        err;

      before(() => {
        server = new Server();
        server.grant('code', 'response', (txn, res, next) => next(new Error('something went wrong while handling response')));
      });

      before((done) => {
        chai.connect.use(decision(server))
          .req((req) => {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.err123 = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'err123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .res((res) => {
            response = res;
          })
          .next((e) => {
            err = e;
            done();
          })
          .end(() => {})
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while handling response');
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
      });

      it('should leave transaction in session', () => {
        expect(request.session.authorize.err123).to.be.an('object');
      });

      it('should remove transaction from session after calling end', () => {
        response.end();
        expect(request.session.authorize.err123).to.be.undefined;
      });
    });

    describe('handling authorization request with unsupported response type', () => {
      let request; let response; let
        err;

      before((done) => {
        chai.connect.use(decision(server))
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
            req.oauth2.req = { type: 'foo', scope: 'email' };
          })
          .res((res) => {
            response = res;
          })
          .next((e) => {
            err = e;
            done();
          })
          .end(() => {})
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unsupported response type: foo');
        expect(err.code).to.equal('unsupported_response_type');
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
      });

      it('should leave transaction in session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
      });

      it('should remove transaction from session after calling end', () => {
        response.end();
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('with parsing function', () => {
      let server; let
        middleware;

      before(() => {
        server = new Server();
        server.grant('code', 'response', (txn, res, next) => {
          if (txn.transactionID !== 'abc123') { return next(new Error('incorrect transaction argument')); }
          if (txn.res.scope !== 'no-email') { return next(new Error('incorrect transaction argument')); }

          if (txn.res.allow === false) { return res.redirect(`${txn.redirectURI}?error=access_denied`); }
          return res.redirect(`${txn.redirectURI}?code=a1b1c1`);
        });
      });

      before(() => {
        middleware = decision(server, (req, done) => {
          done(null, { scope: req.query.scope });
        });
      });

      describe('handling a user decision to allow access', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
          expect(request.oauth2.res.scope).to.equal('no-email');
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });

      describe('handling a user decision to deny access', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
              req.body = { cancel: 'Deny' };
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.false;
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=access_denied');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });
    });

    describe('with parsing function that supplies locals', () => {
      let middleware;

      before(() => {
        middleware = decision(server, (req, done) => {
          done(null, { scope: req.query.scope }, { grant: 'g123' });
        });
      });

      describe('responding to a transaction', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
          expect(request.oauth2.res.scope).to.equal('no-email');
        });

        it('should set locals on transaction', () => {
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.grant).to.equal('g123');
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });

      describe('responding to a transaction with existing locals', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
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
              req.oauth2.locals = { foo: 'bar' };
            })
            .end((res) => {
              response = res;
              done();
            })
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
          expect(request.oauth2.res.scope).to.equal('no-email');
        });

        it('should set locals on transaction', () => {
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.foo).to.equal('bar');
          expect(request.oauth2.locals.grant).to.equal('g123');
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });
    });

    describe('with parsing function that denies access', () => {
      let middleware;

      before(() => {
        middleware = decision(server, (req, done) => {
          done(null, { allow: false });
        });
      });

      describe('handling a user decision', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.false;
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=access_denied');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });
    });

    describe('with parsing function that errors', () => {
      let middleware;

      before(() => {
        middleware = decision(server, (req, done) => {
          done(new Error('something went wrong'));
        });
      });

      describe('handling a user decision', () => {
        let request; let
          err;

        before((done) => {
          chai.connect.use(middleware)
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

        it('should not set user on transaction', () => {
          expect(request.oauth2.user).to.be.undefined;
        });

        it('should not set response on transaction', () => {
          expect(request.oauth2.res).to.be.undefined;
        });

        it('should leave transaction in session', () => {
          expect(request.session.authorize.abc123).to.be.an('object');
        });
      });
    });

    describe('with parsing function that unexpectedly clears session', () => {
      let middleware;

      before(() => {
        middleware = decision(server, (req, done) => {
          req.session = {};
          done(null, { scope: req.query.scope });
        });
      });

      describe('handling a user decision', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
          expect(request.oauth2.res.scope).to.equal('no-email');
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
        });

        it('should remain a cleared session', () => {
          expect(Object.keys(request.session).length).to.equal(0);
        });
      });
    });

    describe('with parsing function and complete function', () => {
      let server;

      before(() => {
        server = new Server();
        server.grant('code', 'response', (txn, res, complete, next) => {
          if (txn.transactionID !== 'abc123') { return next(new Error('incorrect transaction argument')); }
          if (txn.res.scope !== 'no-email') { return next(new Error('incorrect transaction argument')); }

          if (txn.res.allow === false) { return res.redirect(`${txn.redirectURI}?error=access_denied`); }
          complete((err) => {
            if (err) { return next(err); }
            return res.redirect(`${txn.redirectURI}?code=a1b1c1`);
          });
        });
      });

      describe('based on transaction', () => {
        let request; let response; let
          middleware;

        before(() => {
          middleware = decision(server, (req, done) => {
            done(null, { scope: req.query.scope });
          }, (req, txn, done) => {
            if (txn.client.id !== 'c5678') { return done(new Error('incorrect client argument')); }
            if (txn.user.id !== 'u1234') { return done(new Error('incorrect user argument')); }

            req.__federated_to__ = {};
            req.__federated_to__.client = txn.client;
            return done(null);
          });
        });

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
          expect(request.oauth2.res.scope).to.equal('no-email');
        });

        it('should complete transaction', () => {
          expect(request.__federated_to__).to.be.an('object');
          expect(request.__federated_to__.client).to.deep.equal(request.oauth2.client);
          expect(request.__federated_to__.client.id).to.equal('c5678');
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });

      describe('without complete callback', () => {
        let request; let response; let
          middleware;

        before(() => {
          middleware = decision(server, (req, done) => {
            done(null, { scope: req.query.scope });
          });
        });

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
          expect(request.oauth2.res.scope).to.equal('no-email');
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });

      describe('encountering an error completing transaction', () => {
        let request; let response; let err; let
          middleware;

        before(() => {
          middleware = decision(server, (req, done) => {
            done(null, { scope: req.query.scope });
          }, (req, txn, done) => done(new Error('failed to complete transaction')));
        });

        before((done) => {
          chai.connect.use('express', middleware)
            .req((req) => {
              request = req;
              req.query = {};
              req.query.scope = 'no-email';
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
            .res((res) => {
              response = res;
            })
            .next((e) => {
              err = e;
              done();
            })
            .end(() => {})
            .dispatch();
        });

        it('should error', () => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('failed to complete transaction');
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
          expect(request.oauth2.res.scope).to.equal('no-email');
        });

        it('should leave transaction in session', () => {
          expect(request.session.authorize.abc123).to.be.an('object');
        });

        it('should remove transaction from session after calling end', () => {
          response.end();
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });
    });

    describe('with cancel field option', () => {
      describe('handling a user decision to deny access', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', decision(server, { cancelField: 'deny' }))
            .req((req) => {
              request = req;
              req.query = {};
              req.body = { deny: 'Deny' };
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.false;
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=access_denied');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });
    });

    describe('with session key option', () => {
      describe('handling a user decision to allow access', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', decision(server, { sessionKey: 'oauth2orize' }))
            .req((req) => {
              request = req;
              req.query = {};
              req.body = {};
              req.session = {};
              req.session.oauth2orize = {};
              req.session.oauth2orize.abc123 = { protocol: 'oauth2' };
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
        });

        it('should remove transaction from session', () => {
          expect(request.session.oauth2orize.abc123).to.be.undefined;
        });
      });
    });

    describe('with user property option', () => {
      describe('handling a user decision to allow access', () => {
        let request; let
          response;

        before((done) => {
          chai.connect.use('express', decision(server, { userProperty: 'other' }))
            .req((req) => {
              request = req;
              req.query = {};
              req.body = {};
              req.session = {};
              req.session.authorize = {};
              req.session.authorize.abc123 = { protocol: 'oauth2' };
              req.other = { id: 'u1234', username: 'bob' };
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
            .dispatch();
        });

        it('should set user on transaction', () => {
          expect(request.oauth2.user).to.be.an('object');
          expect(request.oauth2.user.id).to.equal('u1234');
          expect(request.oauth2.user.username).to.equal('bob');
        });

        it('should set response on transaction', () => {
          expect(request.oauth2.res).to.be.an('object');
          expect(request.oauth2.res.allow).to.be.true;
        });

        it('should respond', () => {
          expect(response.statusCode).to.equal(302);
          expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
        });

        it('should remove transaction from session', () => {
          expect(request.session.authorize.abc123).to.be.undefined;
        });
      });
    });
  });

  describe('using non-legacy transaction store', () => {
    let server;

    before(() => {
      const MockStore = require('../mock/store');
      server = new Server({ store: new MockStore() });
      server.grant('code', 'response', (txn, res, next) => {
        if (txn.transactionID !== 'abc123') { return next(new Error('incorrect transaction argument')); }

        if (txn.res.allow === false) { return res.redirect(`${txn.redirectURI}?error=access_denied`); }
        return res.redirect(`${txn.redirectURI}?code=a1b1c1`);
      });
    });

    describe('handling a user decision to allow access', () => {
      let request; let
        response;

      before((done) => {
        chai.connect.use('express', decision(server))
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
          .dispatch();
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
      });

      it('should remove transaction', () => {
        expect(request.__mock_store__.removed).to.equal('abc123');
      });

      it('should flag req.end as proxied', () => {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });
  });

  describe('prerequisite middleware checks', () => {
    let server;

    before(() => {
      server = new Server();
    });

    describe('handling a request without a body', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(decision(server))
          .req((req) => {
            request = req;
            req.query = {};
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
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('OAuth2orize requires body parsing. Did you forget app.use(express.bodyParser())?');
      });

      it('should not set user on transaction', () => {
        expect(request.oauth2.user).to.be.undefined;
      });

      it('should not set response on transaction', () => {
        expect(request.oauth2.res).to.be.undefined;
      });

      it('should leave transaction in session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
      });
    });

    describe('handling a request without a transaction', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(decision(server))
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
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('OAuth2orize requires transaction support. Did you forget oauth2orize.transactionLoader(...)?');
      });

      it('should leave transaction in session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
      });
    });
  });
});

/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true */

const chai = require('chai');
const code = require('../../lib/grant/code');
const AuthorizationError = require('../../lib/errors/authorizationerror');


describe('grant.code', () => {
  describe('module', () => {
    const mod = code(() => {});

    it('should be named code', () => {
      expect(mod.name).to.equal('code');
    });

    it('should expose request and response functions', () => {
      expect(mod.request).to.be.a('function');
      expect(mod.response).to.be.a('function');
    });
  });

  it('should throw if constructed without a issue callback', () => {
    expect(() => {
      code();
    }).to.throw(TypeError, 'oauth2orize.code grant requires an issue callback');
  });

  describe('request parsing', () => {
    function issue() {}

    describe('request', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .req((req) => {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.state = 'f1o1o1';
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.undefined;
        expect(out.state).to.equal('f1o1o1');
      });
    });

    describe('request with scope', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .req((req) => {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read';
            req.query.state = 'f1o1o1';
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(1);
        expect(out.scope[0]).to.equal('read');
        expect(out.state).to.equal('f1o1o1');
      });
    });

    describe('request with list of scopes', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .req((req) => {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read write';
            req.query.state = 'f1o1o1';
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(2);
        expect(out.scope[0]).to.equal('read');
        expect(out.scope[1]).to.equal('write');
        expect(out.state).to.equal('f1o1o1');
      });
    });

    describe('request with list of scopes using scope separator option', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code({ scopeSeparator: ',' }, issue))
          .req((req) => {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read,write';
            req.query.state = 'f1o1o1';
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(2);
        expect(out.scope[0]).to.equal('read');
        expect(out.scope[1]).to.equal('write');
        expect(out.state).to.equal('f1o1o1');
      });
    });

    describe('request with list of scopes separated by space using multiple scope separator option', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code({ scopeSeparator: [' ', ','] }, issue))
          .req((req) => {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read write';
            req.query.state = 'f1o1o1';
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(2);
        expect(out.scope[0]).to.equal('read');
        expect(out.scope[1]).to.equal('write');
        expect(out.state).to.equal('f1o1o1');
      });
    });

    describe('request with list of scopes separated by comma using multiple scope separator option', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code({ scopeSeparator: [' ', ','] }, issue))
          .req((req) => {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read,write';
            req.query.state = 'f1o1o1';
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(2);
        expect(out.scope[0]).to.equal('read');
        expect(out.scope[1]).to.equal('write');
        expect(out.state).to.equal('f1o1o1');
      });
    });

    describe('request with missing client_id parameter', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .req((req) => {
            req.query = {};
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.state = 'f1o1o1';
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Missing required parameter: client_id');
        expect(err.code).to.equal('invalid_request');
      });
    });

    describe('request with invalid client_id parameter', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .req((req) => {
            req.query = {};
            req.query.client_id = ['c123', 'c123'];
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.state = 'f1o1o1';
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Invalid parameter: client_id must be a string');
        expect(err.code).to.equal('invalid_request');
      });
    });

    describe('request with scope parameter that is not a string', () => {
      let err; let
        out;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .req((req) => {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.state = 'f1o1o1';
            req.query.scope = ['read', 'write'];
          })
          .parse((e, o) => {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Invalid parameter: scope must be a string');
        expect(err.code).to.equal('invalid_request');
      });
    });
  });

  describe('decision handling', () => {
    describe('transaction', () => {
      let response;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, 'xyz');
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz');
      });
    });

    describe('transaction with request state', () => {
      let response;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, 'xyz');
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 'f1o1o1',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz&state=f1o1o1');
      });
    });

    describe('transaction with request state and complete callback', () => {
      let response; let
        completed;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, 'xyz');
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 'f1o1o1',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide((cb) => {
            completed = true;
            process.nextTick(() => { cb(); });
          });
      });

      it('should call complete callback', () => {
        expect(completed).to.be.true;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz&state=f1o1o1');
      });
    });

    describe('disallowed transaction', () => {
      let response;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, 'xyz');
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: false };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?error=access_denied');
      });
    });

    describe('disallowed transaction with request state', () => {
      let response;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, 'xyz');
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 'f2o2o2',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: false };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?error=access_denied&state=f2o2o2');
      });
    });

    describe('unauthorized client', () => {
      let err;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          return done(null, false);
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'cUNAUTHZ', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next((e) => {
            err = e;
            done();
          })
          .decide();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Request denied by authorization server');
        expect(err.code).to.equal('access_denied');
        expect(err.status).to.equal(403);
      });
    });

    describe('encountering an error while issuing code', () => {
      let err;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          return done(new Error('something went wrong'));
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'cERROR', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next((e) => {
            err = e;
            done();
          })
          .decide();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });

    describe('throwing an error while issuing code', () => {
      let err;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          throw new Error('something was thrown');
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'cTHROW', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next((e) => {
            err = e;
            done();
          })
          .decide();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown');
      });
    });

    describe('encountering an error while completing transaction', () => {
      let err;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          return done(null, 'xyz');
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'cERROR', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next((e) => {
            err = e;
            done();
          })
          .decide((cb) => {
            process.nextTick(() => { cb(new Error('failed to complete transaction')); });
          });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('failed to complete transaction');
      });
    });

    describe('transaction without redirect URL', () => {
      let err;

      before((done) => {
        function issue(client, redirectURI, user, done) {
          return done(null, 'xyz');
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next((e) => {
            err = e;
            done();
          })
          .decide();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(AuthorizationError);
        expect(err.code).to.equal('server_error');
        expect(err.message).to.equal('Unable to issue redirect for OAuth 2.0 transaction');
      });
    });
  });

  describe('decision handling with user response', () => {
    function issue(client, redirectURI, user, ares, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
      if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
      if (ares.scope !== 'foo') { return done(new Error('incorrect ares argument')); }

      return done(null, 'xyz');
    }

    describe('transaction with response scope', () => {
      let response;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true, scope: 'foo' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz');
      });
    });
  });

  describe('decision handling with user response and client request', () => {
    function issue(client, redirectURI, user, ares, areq, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
      if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
      if (ares.scope !== 'foo') { return done(new Error('incorrect ares argument')); }
      if (areq.codeChallenge !== 'hashed-s3cr1t') { return done(new Error('incorrect areq argument')); }

      return done(null, 'xyz');
    }

    describe('transaction with response scope', () => {
      let response;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              codeChallenge: 'hashed-s3cr1t',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true, scope: 'foo' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz');
      });
    });
  });

  describe('decision handling with user response, client request, and server locals', () => {
    function issue(client, redirectURI, user, ares, areq, locals, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
      if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
      if (ares.scope !== 'foo') { return done(new Error('incorrect ares argument')); }
      if (areq.codeChallenge !== 'hashed-s3cr1t') { return done(new Error('incorrect areq argument')); }
      if (locals.service.jwksURL !== 'http://www.example.com/.well-known/jwks') { return done(new Error('incorrect locals argument')); }

      return done(null, 'xyz');
    }

    describe('transaction with response scope', () => {
      let response;

      before((done) => {
        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              codeChallenge: 'hashed-s3cr1t',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true, scope: 'foo' };
            txn.locals = { service: { jwksURL: 'http://www.example.com/.well-known/jwks' } };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz');
      });
    });
  });

  describe('decision handling with response mode', () => {
    function issue(client, redirectURI, user, done) {
      return done(null, 'xyz');
    }

    const fooResponseMode = function (txn, res, params) {
      expect(txn.req.redirectURI).to.equal('http://example.com/auth/callback');
      expect(params.code).to.equal('xyz');
      expect(params.state).to.equal('s1t2u3');

      res.redirect('/foo');
    };


    describe('transaction using default response mode', () => {
      let response;

      before((done) => {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 's1t2u3',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz&state=s1t2u3');
      });
    });

    describe('transaction using foo response mode', () => {
      let response;

      before((done) => {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 's1t2u3',
              responseMode: 'foo',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/foo');
      });
    });

    describe('disallowed transaction using foo response mode', () => {
      const fooResponseMode = function (txn, res, params) {
        expect(txn.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(params.error).to.equal('access_denied');
        expect(params.state).to.equal('s1t2u3');

        res.redirect('/foo');
      };

      let response;

      before((done) => {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 's1t2u3',
              responseMode: 'foo',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: false };
          })
          .end((res) => {
            response = res;
            done();
          })
          .decide();
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/foo');
      });
    });

    describe('transaction using unsupported response mode', () => {
      let err;

      before((done) => {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 's1t2u3',
              responseMode: 'fubar',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next((e) => {
            err = e;
            done();
          })
          .decide();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unsupported response mode: fubar');
        expect(err.code).to.equal('unsupported_response_mode');
        expect(err.uri).to.equal(null);
        expect(err.status).to.equal(501);
      });
    });
  });

  describe('error handling', () => {
    describe('error on transaction', () => {
      let response;

      before((done) => {
        function issue(client, redirectURI, user, done) {
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .error(new Error('something went wrong'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(response.body).to.be.undefined;
      });
    });

    describe('authorization error on transaction', () => {
      let response;

      before((done) => {
        function issue(client, redirectURI, user, done) {
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .error(new AuthorizationError('not authorized', 'unauthorized_client'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(response.body).to.be.undefined;
      });
    });

    describe('authorization error with URI on transaction', () => {
      let response;

      before((done) => {
        function issue(client, redirectURI, user, done) {
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .error(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(response.body).to.be.undefined;
      });
    });

    describe('error on transaction with state', () => {
      let response;

      before((done) => {
        function issue(client, redirectURI, user, done) {
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .error(new Error('something went wrong'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong&state=1234');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(response.body).to.be.undefined;
      });
    });

    describe('error on transaction without redirectURI', () => {
      let response; let
        err;

      before((done) => {
        function issue(client, redirectURI, user, done) {
        }

        chai.oauth2orize.grant(code(issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next((e) => {
            err = e;
            done();
          })
          .error(new Error('something went wrong'));
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });

  describe('error handling with response mode', () => {
    function issue(client, redirectURI, user, done) {
    }

    const fooResponseMode = function (txn, res, params) {
      expect(txn.req.redirectURI).to.equal('http://example.com/auth/callback');
      expect(params.error).to.equal('unauthorized_client');
      expect(params.error_description).to.equal('not authorized');
      expect(params.error_uri).to.equal('http://example.com/errors/2');
      expect(params.state).to.equal('1234');

      res.redirect('/foo');
    };


    describe('transaction using default response mode', () => {
      let response;

      before((done) => {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .error(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2&state=1234');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(response.body).to.be.undefined;
      });
    });

    describe('transaction using foo response mode', () => {
      let response;

      before((done) => {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234',
              responseMode: 'foo',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end((res) => {
            response = res;
            done();
          })
          .error(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/foo');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });

      it('should not set response body', () => {
        expect(response.body).to.be.undefined;
      });
    });

    describe('transaction using unsupported response mode', () => {
      let response; let
        err;

      before((done) => {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn((txn) => {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234',
              responseMode: 'fubar',
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next((e) => {
            err = e;
            done();
          })
          .error(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('not authorized');
        expect(err.code).to.equal('unauthorized_client');
        expect(err.uri).to.equal('http://example.com/errors/2');
        expect(err.status).to.equal(403);
      });
    });
  });
});

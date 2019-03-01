/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

const chai = require('chai');
const authorization = require('../../lib/middleware/authorization');
const Server = require('../../lib/server');


describe('authorization', () => {
  it('should be named authorization', () => {
    const server = new Server();
    expect(authorization(server, () => {}).name).to.equal('authorization');
  });

  it('should throw if constructed without a server argument', () => {
    expect(() => {
      authorization();
    }).to.throw(TypeError, 'oauth2orize.authorization middleware requires a server argument');
  });

  it('should throw if constructed without a validate argument', () => {
    expect(() => {
      const server = new Server();
      authorization(server);
    }).to.throw(TypeError, 'oauth2orize.authorization middleware requires a validate function');
  });


  describe('request parsing', () => {
    let server; let
      validate;

    before(() => {
      server = new Server();

      server.grant('code', req => ({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        scope: req.query.scope,
      }));

      server.grant('*', (req) => {
        if (req.query.audience) {
          return {
            audience: req.query.audience,
          };
        }
        return {};
      });

      server.grant('exception', (req) => {
        throw new Error('something went wrong while parsing authorization request');
      });
    });

    before(() => {
      validate = function (clientID, redirectURI, done) {};
    });


    describe('handling a request for authorization with empty query', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = {};
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Missing required parameter: response_type');
        expect(err.code).to.equal('invalid_request');
      });

      it('should not start transaction', () => {
        expect(request.oauth2).to.be.undefined;
      });
    });

    describe('handling a request for authorization with unsupported response type', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'foo', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unsupported response type: foo');
        expect(err.code).to.equal('unsupported_response_type');
      });

      it('should not start transaction', () => {
        expect(request.oauth2).to.be.undefined;
      });
    });

    describe('handling a request for authorization with unsupported response type with extension parameters', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = {
              response_type: 'foo', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', audience: 'https://api.example.com/',
            };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unsupported response type: foo');
        expect(err.code).to.equal('unsupported_response_type');
      });

      it('should not start transaction', () => {
        expect(request.oauth2).to.be.undefined;
      });
    });

    describe('encountering an exception while parsing request', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'exception', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while parsing authorization request');
      });

      it('should not start transaction', () => {
        expect(request.oauth2).to.be.undefined;
      });
    });

    describe('without registered grants', () => {
      let server; let request; let
        err;

      before(() => {
        server = new Server();
      });

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unsupported response type: code');
        expect(err.code).to.equal('unsupported_response_type');
      });

      it('should not start transaction', () => {
        expect(request.oauth2).to.be.undefined;
      });
    });
  });

  describe('client validation', () => {
    let server;

    before(() => {
      server = new Server();
      server.grant('code', req => ({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        scope: req.query.scope,
      }));
    });


    describe('unauthorized client', () => {
      let request; let
        err;

      before((done) => {
        function validate(clientID, redirectURI, done) {
          return done(null, false);
        }

        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '2234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: '1', username: 'root' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unauthorized client');
        expect(err.code).to.equal('unauthorized_client');
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.client).to.be.undefined;
        expect(request.oauth2.redirectURI).to.be.undefined;
        expect(request.oauth2.req).to.be.an('object');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('1');
      });
    });

    describe('unauthorized client informed via redirect', () => {
      let request; let
        err;

      before((done) => {
        function validate(clientID, redirectURI, done) {
          return done(null, false, 'http://example.com/auth/callback');
        }

        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '3234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unauthorized client');
        expect(err.code).to.equal('unauthorized_client');
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.client).to.be.undefined;
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
      });
    });

    describe('encountering an error while validating client', () => {
      let request; let
        err;

      before((done) => {
        function validate(clientID, redirectURI, done) {
          return done(new Error('something went wrong while validating client'));
        }

        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '9234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while validating client');
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.client).to.be.undefined;
        expect(request.oauth2.redirectURI).to.be.undefined;
      });
    });

    describe('encountering a thrown exception while validating client', () => {
      let request; let
        err;

      before((done) => {
        function validate(clientID, redirectURI, done) {
          throw new Error('something was thrown while validating client');
        }

        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '4234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown while validating client');
      });

      it('should not start transaction', () => {
        expect(request.oauth2).to.be.undefined;
      });
    });
  });


  describe('using legacy transaction store', () => {
    let server; let
      validate;

    before(() => {
      server = new Server();
      server.serializeClient((client, done) => {
        if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
        return done(null, client.id);
      });

      server.grant('code', req => ({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        scope: req.query.scope,
      }));
    });

    before(() => {
      validate = function (clientID, redirectURI, done) {
        if (clientID !== '1234') { return done(new Error('incorrect client argument')); }
        if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }

        return done(null, { id: clientID, name: 'Example' }, 'http://example.com/auth/callback');
      };
    });


    describe('handling a request for authorization', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(16);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
      });

      it('should store transaction in session', () => {
        const tid = request.oauth2.transactionID;
        expect(request.session.authorize[tid]).to.be.an('object');
        expect(request.session.authorize[tid].protocol).to.equal('oauth2');
        expect(request.session.authorize[tid].client).to.equal('1234');
        expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.session.authorize[tid].req.type).to.equal('code');
        expect(request.session.authorize[tid].req.clientID).to.equal('1234');
        expect(request.session.authorize[tid].req.redirectURI).to.equal('http://example.com/auth/callback');
      });
    });

    describe('handling a request for authorization, validating with scope', () => {
      let validate; let request; let
        err;

      before(() => {
        validate = function (clientID, redirectURI, scope, done) {
          if (clientID !== '1234') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (scope !== 'write') { return done(new Error('incorrect scope argument')); }

          return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
        };
      });

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = {
              response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'write',
            };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });


      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(16);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.scope).to.equal('write');
      });

      it('should store transaction in session', () => {
        const tid = request.oauth2.transactionID;
        expect(request.session.authorize[tid]).to.be.an('object');
        expect(request.session.authorize[tid].protocol).to.equal('oauth2');
        expect(request.session.authorize[tid].client).to.equal('1234');
        expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.session.authorize[tid].req.type).to.equal('code');
        expect(request.session.authorize[tid].req.clientID).to.equal('1234');
        expect(request.session.authorize[tid].req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.session.authorize[tid].req.scope).to.equal('write');
      });
    });

    describe('handling a request for authorization, validating with scope and type', () => {
      let validate; let request; let
        err;

      before(() => {
        validate = function (clientID, redirectURI, scope, type, done) {
          if (clientID !== '1234') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (scope !== 'write') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }

          return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
        };
      });

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = {
              response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'write',
            };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });


      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(16);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.scope).to.equal('write');
      });

      it('should store transaction in session', () => {
        const tid = request.oauth2.transactionID;
        expect(request.session.authorize[tid]).to.be.an('object');
        expect(request.session.authorize[tid].protocol).to.equal('oauth2');
        expect(request.session.authorize[tid].client).to.equal('1234');
        expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.session.authorize[tid].req.type).to.equal('code');
        expect(request.session.authorize[tid].req.clientID).to.equal('1234');
        expect(request.session.authorize[tid].req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.session.authorize[tid].req.scope).to.equal('write');
      });
    });

    describe('handling a request for authorization, validating with authorization request', () => {
      let validate; let request; let
        err;

      before(() => {
        validate = function (areq, done) {
          if (areq.clientID !== '1234') { return done(new Error('incorrect client argument')); }
          if (areq.redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }

          return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
        };
      });

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });


      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should add transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(16);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
      });

      it('should store transaction in session', () => {
        const tid = request.oauth2.transactionID;
        expect(request.session.authorize[tid]).to.be.an('object');
        expect(request.session.authorize[tid].protocol).to.equal('oauth2');
        expect(request.session.authorize[tid].client).to.equal('1234');
        expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.session.authorize[tid].req.type).to.equal('code');
        expect(request.session.authorize[tid].req.clientID).to.equal('1234');
        expect(request.session.authorize[tid].req.redirectURI).to.equal('http://example.com/auth/callback');
      });
    });

    describe('handling a request for authorization allowing web origin response', () => {
      let request; let
        err;

      before(() => {
        validate = function (clientID, redirectURI, done) {
          if (clientID !== '1234') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }

          return done(null, { id: clientID, name: 'Example' }, 'http://example.com/auth/callback', 'http://example.com');
        };
      });

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(16);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.webOrigin).to.equal('http://example.com');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
      });

      it('should store transaction in session', () => {
        const tid = request.oauth2.transactionID;
        expect(request.session.authorize[tid]).to.be.an('object');
        expect(request.session.authorize[tid].protocol).to.equal('oauth2');
        expect(request.session.authorize[tid].client).to.equal('1234');
        expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.session.authorize[tid].webOrigin).to.equal('http://example.com');
        expect(request.session.authorize[tid].req.type).to.equal('code');
        expect(request.session.authorize[tid].req.clientID).to.equal('1234');
        expect(request.session.authorize[tid].req.redirectURI).to.equal('http://example.com/auth/callback');
      });
    });

    describe('attempting to store transaction without a session', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('OAuth2orize requires session support. Did you forget app.use(express.session(...))?');
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req).to.be.an('object');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
      });
    });

    describe('encountering an error while serializing client', () => {
      let server; let request; let
        err;

      before(() => {
        server = new Server();
        server.serializeClient((client, done) => done(new Error('something went wrong while serializing client')));

        server.grant('code', req => ({
          clientID: req.query.client_id,
          redirectURI: req.query.redirect_uri,
          scope: req.query.scope,
        }));
      });

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while serializing client');
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req).to.be.an('object');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
      });

      it('should not store transaction in session', () => {
        expect(Object.keys(request.session).length).to.equal(0);
      });
    });

    describe('with id length option', () => {
      describe('handling a request for authorization', () => {
        let request; let
          err;

        before((done) => {
          chai.connect.use(authorization(server, { idLength: 12 }, validate))
            .req((req) => {
              request = req;
              req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
              req.session = {};
            })
            .next((e) => {
              err = e;
              done();
            })
            .dispatch();
        });

        it('should not error', () => {
          expect(err).to.be.undefined;
        });

        it('should start transaction', () => {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.transactionID).to.be.a('string');
          expect(request.oauth2.transactionID).to.have.length(24);
          expect(request.oauth2.client.id).to.equal('1234');
          expect(request.oauth2.client.name).to.equal('Example');
          expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.oauth2.req.type).to.equal('code');
          expect(request.oauth2.req.clientID).to.equal('1234');
          expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
        });

        it('should store transaction in session', () => {
          const tid = request.oauth2.transactionID;
          expect(request.session.authorize[tid]).to.be.an('object');
          expect(request.session.authorize[tid].protocol).to.equal('oauth2');
          expect(request.session.authorize[tid].client).to.equal('1234');
          expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session.authorize[tid].req.type).to.equal('code');
          expect(request.session.authorize[tid].req.clientID).to.equal('1234');
          expect(request.session.authorize[tid].req.redirectURI).to.equal('http://example.com/auth/callback');
        });
      });
    });

    describe('with session key option', () => {
      describe('handling a request for authorization', () => {
        let request; let
          err;

        before((done) => {
          chai.connect.use(authorization(server, { sessionKey: 'oauth2z' }, validate))
            .req((req) => {
              request = req;
              req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
              req.session = {};
            })
            .next((e) => {
              err = e;
              done();
            })
            .dispatch();
        });

        it('should not error', () => {
          expect(err).to.be.undefined;
        });

        it('should add transaction', () => {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.transactionID).to.be.a('string');
          expect(request.oauth2.transactionID).to.have.length(16);
          expect(request.oauth2.client.id).to.equal('1234');
          expect(request.oauth2.client.name).to.equal('Example');
          expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.oauth2.req.type).to.equal('code');
          expect(request.oauth2.req.clientID).to.equal('1234');
          expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
        });

        it('should store transaction in session', () => {
          const tid = request.oauth2.transactionID;
          expect(request.session.oauth2z[tid]).to.be.an('object');
          expect(request.session.oauth2z[tid].protocol).to.equal('oauth2');
          expect(request.session.oauth2z[tid].client).to.equal('1234');
          expect(request.session.oauth2z[tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session.oauth2z[tid].req.type).to.equal('code');
          expect(request.session.oauth2z[tid].req.clientID).to.equal('1234');
          expect(request.session.oauth2z[tid].req.redirectURI).to.equal('http://example.com/auth/callback');
        });
      });
    });
  });

  describe('using non-legacy transaction store', () => {
    let server; let
      validate;

    before(() => {
      const MockStore = require('../mock/store');
      server = new Server({ store: new MockStore() });

      server.grant('code', req => ({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        scope: req.query.scope,
      }));
    });

    before(() => {
      validate = function (clientID, redirectURI, done) {
        if (clientID !== '1234') { return done(new Error('incorrect client argument')); }
        if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }

        return done(null, { id: clientID, name: 'Example' }, 'http://example.com/auth/callback');
      };
    });


    describe('handling a request for authorization', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(authorization(server, validate))
          .req((req) => {
            request = req;
            req.user = { id: '1', username: 'root' };
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should start transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.equal('mocktxn-1');
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.user.id).to.equal('1');
        expect(request.oauth2.user.username).to.equal('root');
      });

      it('should serialize transaction', () => {
        expect(request.__mock_store__.txn).to.be.an('object');
        expect(Object.keys(request.__mock_store__.txn)).to.have.length(6);
        expect(request.__mock_store__.txn.transactionID).to.equal('mocktxn-1');
        expect(request.__mock_store__.txn.client.id).to.equal('1234');
        expect(request.__mock_store__.txn.client.name).to.equal('Example');
        expect(request.__mock_store__.txn.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.__mock_store__.txn.req.type).to.equal('code');
        expect(request.__mock_store__.txn.req.clientID).to.equal('1234');
        expect(request.__mock_store__.txn.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.__mock_store__.txn.user.id).to.equal('1');
        expect(request.__mock_store__.txn.user.username).to.equal('root');
        expect(request.__mock_store__.txn.info).to.be.undefined;
      });
    });
  });
});

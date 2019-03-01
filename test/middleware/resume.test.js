/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

const chai = require('chai');
const resume = require('../../lib/middleware/resume');
const Server = require('../../lib/server');


describe('resume', () => {
  it('should be named resume', () => {
    const server = new Server();
    expect(resume(server, () => {}).name).to.equal('resume');
  });

  it('should throw if constructed without a server argument', () => {
    expect(() => {
      resume();
    }).to.throw(TypeError, 'oauth2orize.resume middleware requires a server argument');
  });

  it('should throw if constructed without a immediate argument', () => {
    expect(() => {
      const server = new Server();
      resume(server);
    }).to.throw(TypeError, 'oauth2orize.resume middleware requires an immediate function');
  });

  describe('immediate response', () => {
    let server; let
      immediate;

    before(() => {
      server = new Server();
      server.grant('code', 'response', (txn, res, next) => {
        if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        if (txn.res.allow !== true) { return done(new Error('incorrect ares argument')); }
        if (txn.res.scope !== 'profile email') { return done(new Error('incorrect ares argument')); }

        return res.redirect(txn.redirectURI);
      });
    });

    before(() => {
      immediate = function (client, user, done) {
        if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

        return done(null, true, { scope: 'profile email' });
      };
    });

    describe('based on client and user', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });

      it('should flag req.end as proxied', () => {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });

    describe('based on client, user, and scope', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on client, user, scope, and type', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, type, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on client, user, scope, and type, and authorization request', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, type, areq, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on client, user, scope, and type, and authorization request, that supplies locals', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, type, areq, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }

          return done(null, true, { scope: 'profile email' }, { service: { name: 'Contacts' } });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(1);
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on client, user, scope, and type, authorization request, and locals', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals !== undefined) { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on client, user, scope, and type, authorization request, and response locals', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.grant.id !== 'g123') { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .res((res) => {
            res.locals = { grant: { id: 'g123' } };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(1);
        expect(request.oauth2.locals.grant.id).to.equal('g123');
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on client, user, scope, and type, authorization request, and response and transaction locals', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.grant.id !== 'g123') { return done(new Error('incorrect locals argument')); }
          if (locals.service.name !== 'Contacts') { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
            req.oauth2.locals = { service: { name: 'Contacts' } };
          })
          .res((res) => {
            res.locals = { grant: { id: 'g123' } };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(2);
        expect(request.oauth2.locals.grant.id).to.equal('g123');
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on client, user, scope, and type, authorization request, and transaction locals', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.service.name !== 'Contacts') { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
            req.oauth2.locals = { service: { name: 'Contacts' } };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(1);
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on client, user, scope, and type, authorization request, and transaction locals, that supplies additional locals', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.service.name !== 'Contacts') { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'profile email' }, { ip: '127.0.0.1' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
            req.oauth2.locals = { service: { name: 'Contacts' } };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(2);
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
        expect(request.oauth2.locals.ip).to.equal('127.0.0.1');
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('based on complete transaction', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (txn, done) {
          if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (txn.req.scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (txn.req.type !== 'code') { return done(new Error('incorrect type argument')); }
          if (txn.req.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (txn.locals.service.name !== 'Contacts') { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'profile email' }, { ip: '127.0.0.1' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
            req.oauth2.locals = { service: { name: 'Contacts' } };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(2);
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
        expect(request.oauth2.locals.ip).to.equal('127.0.0.1');
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('encountering an error', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, done) {
          return done(new Error('something went wrong while checking immediate status'));
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while checking immediate status');
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should not set response on transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.undefined;
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should not remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
        expect(Object.keys(request.session.authorize.abc123)).to.have.length(1);
        expect(request.session.authorize.abc123.protocol).to.equal('oauth2');
      });
    });

    describe('encountering an exception', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, done) {
          throw new Error('something was thrown while checking immediate status');
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .next((e) => {
            err = e;
            done();
          })
          .dispatch();
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown while checking immediate status');
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should not set response on transaction', () => {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.undefined;
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should not remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
        expect(Object.keys(request.session.authorize.abc123)).to.have.length(1);
        expect(request.session.authorize.abc123.protocol).to.equal('oauth2');
      });
    });

    describe('encountering an error while responding to request', () => {
      let server; let request; let response; let
        err;

      before(() => {
        server = new Server();

        server.grant('code', 'response', (txn, res, next) => next(new Error('something went wrong while sending response')));
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
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
        expect(err.message).to.equal('something went wrong while sending response');
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should leave transaction in session', () => {
        expect(request.session.authorize.abc123).to.be.an('object');
      });

      it('should remove transaction from session after calling end', () => {
        response.end();
        expect(request.session.authorize.abc123).to.be.undefined;
      });
    });

    describe('handling authorization request with unsupported response type', () => {
      let request; let response; let
        err;

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'foo', scope: 'email', audience: 'https://api.example.com/' };
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
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
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

  describe('immediate response with complete callback', () => {
    let server;

    before(() => {
      server = new Server();
      server.grant('code', 'response', (txn, res, complete, next) => {
        if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        if (txn.res.allow !== true) { return done(new Error('incorrect ares argument')); }
        if (txn.res.scope !== 'profile email') { return done(new Error('incorrect ares argument')); }

        complete((err) => {
          if (err) { return next(err); }
          return res.redirect(txn.redirectURI);
        });
      });
    });

    describe('based on transaction', () => {
      let immediate; let complete; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before(() => {
        complete = function (req, txn, done) {
          if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          req.__federated_to__ = {};
          req.__federated_to__.client = txn.client;
          return done(null);
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate, complete))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should complete transaction', () => {
        expect(request.__federated_to__).to.be.an('object');
        expect(request.__federated_to__.client).to.deep.equal(request.oauth2.client);
        expect(request.__federated_to__.client.id).to.equal('1234');
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });

      it('should flag req.end as proxied', () => {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });

    describe('without complete callback', () => {
      let immediate; let complete; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction from session', () => {
        expect(request.session.authorize.abc123).to.be.undefined;
      });

      it('should flag req.end as proxied', () => {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });

    describe('encountering an error completing transaction', () => {
      let immediate; let complete; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before(() => {
        complete = function (req, txn, done) {
          return done(new Error('failed to complete transaction'));
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate, complete))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
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
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
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

  describe('immediate response using non-legacy transaction store', () => {
    let server; let
      immediate;

    before(() => {
      const MockStore = require('../mock/store');
      server = new Server({ store: new MockStore() });
      server.grant('code', 'response', (txn, res, next) => {
        if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        if (txn.res.allow !== true) { return done(new Error('incorrect ares argument')); }
        if (txn.res.scope !== 'profile email') { return done(new Error('incorrect ares argument')); }

        return res.redirect(txn.redirectURI);
      });
    });

    before(() => {
      immediate = function (client, user, done) {
        if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

        return done(null, true, { scope: 'profile email' });
      };
    });

    describe('based on client and user', () => {
      let immediate; let request; let response; let
        err;

      before(() => {
        immediate = function (client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, true, { scope: 'profile email' });
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should set user on transaction', () => {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });

      it('should set response on transaction', () => {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });

      it('should respond', () => {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });

      it('should remove transaction', () => {
        expect(request.__mock_store__.removed).to.equal('abc123');
      });

      it('should flag req.end as proxied', () => {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });
  });


  describe('non-immediate response', () => {
    describe('using legacy transaction store', () => {
      let server; let
        immediate;

      before(() => {
        server = new Server();
        server.serializeClient((client, done) => done(null, client.id));
      });

      describe('based on client and user', () => {
        let immediate; let request; let
          err;

        before(() => {
          immediate = function (client, user, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

            return done(null, false);
          };
        });

        before((done) => {
          chai.connect.use('express', resume(server, immediate))
            .req((req) => {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s' };
              req.session = {};
              req.session.authorize = {};
              req.session.authorize.abc123 = { protocol: 'oauth2' };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
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
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.undefined;
          expect(request.oauth2.locals).to.be.undefined;
        });

        it('should update transaction in session', () => {
          expect(request.oauth2.transactionID).to.equal('abc123');
          const tid = request.oauth2.transactionID;
          expect(request.session.authorize[tid]).to.be.an('object');
          expect(request.session.authorize[tid].protocol).to.equal('oauth2');
          expect(request.session.authorize[tid].client).to.equal('1234');
          expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session.authorize[tid].req.type).to.equal('code');
          expect(request.session.authorize[tid].req.scope).to.equal('email');
          expect(request.session.authorize[tid].info).to.be.undefined;
          expect(request.session.authorize[tid].locals).to.be.undefined;
        });
      });

      describe('based on client and user, with result that clears previous info', () => {
        let immediate; let request; let
          err;

        before(() => {
          immediate = function (client, user, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

            return done(null, false);
          };
        });

        before((done) => {
          chai.connect.use('express', resume(server, immediate))
            .req((req) => {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s' };
              req.session = {};
              req.session.authorize = {};
              req.session.authorize.abc123 = { protocol: 'oauth2', info: { foo: 'bar' } };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
              req.oauth2.info = { foo: 'bar' };
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
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.undefined;
          expect(request.oauth2.locals).to.be.undefined;
        });

        it('should update transaction in session', () => {
          expect(request.oauth2.transactionID).to.equal('abc123');
          const tid = request.oauth2.transactionID;
          expect(request.session.authorize[tid]).to.be.an('object');
          expect(request.session.authorize[tid].protocol).to.equal('oauth2');
          expect(request.session.authorize[tid].client).to.equal('1234');
          expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session.authorize[tid].req.type).to.equal('code');
          expect(request.session.authorize[tid].req.scope).to.equal('email');
          expect(request.session.authorize[tid].info).to.be.undefined;
          expect(request.session.authorize[tid].locals).to.be.undefined;
        });
      });

      describe('based on client, user, and scope, with result that supplies info', () => {
        let immediate; let request; let
          err;

        before(() => {
          immediate = function (client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }

            return done(null, false, { scope: 'read', confidential: true });
          };
        });

        before((done) => {
          chai.connect.use('express', resume(server, immediate))
            .req((req) => {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s' };
              req.session = {};
              req.session.authorize = {};
              req.session.authorize.abc123 = { protocol: 'oauth2' };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
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
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.undefined;
        });

        it('should update transaction in session', () => {
          expect(request.oauth2.transactionID).to.equal('abc123');
          const tid = request.oauth2.transactionID;
          expect(request.session.authorize[tid]).to.be.an('object');
          expect(request.session.authorize[tid].protocol).to.equal('oauth2');
          expect(request.session.authorize[tid].client).to.equal('1234');
          expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session.authorize[tid].req.type).to.equal('code');
          expect(request.session.authorize[tid].req.scope).to.equal('email');
          expect(request.session.authorize[tid].info.scope).to.equal('read');
          expect(request.session.authorize[tid].info.confidential).to.equal(true);
          expect(request.session.authorize[tid].locals).to.be.undefined;
        });
      });

      describe('based on client, user, and scope, with result that supplies overridden info', () => {
        let immediate; let request; let
          err;

        before(() => {
          immediate = function (client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }

            return done(null, false, { scope: 'read', confidential: true });
          };
        });

        before((done) => {
          chai.connect.use('express', resume(server, immediate))
            .req((req) => {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s' };
              req.session = {};
              req.session.authorize = {};
              req.session.authorize.abc123 = { protocol: 'oauth2', info: { foo: 'bar' } };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
              req.oauth2.info = { foo: 'bar' };
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
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.undefined;
        });

        it('should update transaction in session', () => {
          expect(request.oauth2.transactionID).to.equal('abc123');
          const tid = request.oauth2.transactionID;
          expect(request.session.authorize[tid]).to.be.an('object');
          expect(request.session.authorize[tid].protocol).to.equal('oauth2');
          expect(request.session.authorize[tid].client).to.equal('1234');
          expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session.authorize[tid].req.type).to.equal('code');
          expect(request.session.authorize[tid].req.scope).to.equal('email');
          expect(request.session.authorize[tid].info.scope).to.equal('read');
          expect(request.session.authorize[tid].info.confidential).to.equal(true);
          expect(request.session.authorize[tid].locals).to.be.undefined;
        });
      });

      describe('based on client, user, and scope, with result that supplies info and locals', () => {
        let immediate; let request; let
          err;

        before(() => {
          immediate = function (client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }

            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
          };
        });

        before((done) => {
          chai.connect.use('express', resume(server, immediate))
            .req((req) => {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s' };
              req.session = {};
              req.session.authorize = {};
              req.session.authorize.abc123 = { protocol: 'oauth2' };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
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
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.an('object');
          expect(Object.keys(request.oauth2.locals)).to.have.length(1);
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });

        it('should update transaction in session', () => {
          expect(request.oauth2.transactionID).to.equal('abc123');
          const tid = request.oauth2.transactionID;
          expect(request.session.authorize[tid]).to.be.an('object');
          expect(request.session.authorize[tid].protocol).to.equal('oauth2');
          expect(request.session.authorize[tid].client).to.equal('1234');
          expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session.authorize[tid].req.type).to.equal('code');
          expect(request.session.authorize[tid].req.scope).to.equal('email');
          expect(request.session.authorize[tid].info.scope).to.equal('read');
          expect(request.session.authorize[tid].info.confidential).to.equal(true);
          expect(request.session.authorize[tid].locals).to.be.undefined;
        });
      });

      describe('based on client, user, and scope, with result that supplies info and additional locals', () => {
        let immediate; let request; let
          err;

        before(() => {
          immediate = function (client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }

            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
          };
        });

        before((done) => {
          chai.connect.use('express', resume(server, immediate))
            .req((req) => {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s' };
              req.session = {};
              req.session.authorize = {};
              req.session.authorize.abc123 = { protocol: 'oauth2' };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
              req.oauth2.locals = { service: { name: 'Contacts' } };
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
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.an('object');
          expect(Object.keys(request.oauth2.locals)).to.have.length(2);
          expect(request.oauth2.locals.service.name).to.equal('Contacts');
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });

        it('should update transaction in session', () => {
          expect(request.oauth2.transactionID).to.equal('abc123');
          const tid = request.oauth2.transactionID;
          expect(request.session.authorize[tid]).to.be.an('object');
          expect(request.session.authorize[tid].protocol).to.equal('oauth2');
          expect(request.session.authorize[tid].client).to.equal('1234');
          expect(request.session.authorize[tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session.authorize[tid].req.type).to.equal('code');
          expect(request.session.authorize[tid].req.scope).to.equal('email');
          expect(request.session.authorize[tid].info.scope).to.equal('read');
          expect(request.session.authorize[tid].info.confidential).to.equal(true);
          expect(request.session.authorize[tid].locals).to.be.undefined;
        });
      });
    });

    describe('using non-legacy transaction store', () => {
      let server; let
        immediate;

      before(() => {
        const MockStore = require('../mock/store');
        server = new Server({ store: new MockStore() });
      });

      describe('based on client, user, and scope, with result that supplies info and locals', () => {
        let immediate; let request; let
          err;

        before(() => {
          immediate = function (client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }

            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
          };
        });

        before((done) => {
          chai.connect.use('express', resume(server, immediate))
            .req((req) => {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s' };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
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
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.an('object');
          expect(Object.keys(request.oauth2.locals)).to.have.length(1);
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });

        it('should reserialize transaction', () => {
          expect(request.oauth2.transactionID).to.equal('mocktxn-1u');
          expect(request.__mock_store__.uh).to.equal('abc123');
          expect(request.__mock_store__.utxn).to.be.an('object');
          expect(request.__mock_store__.utxn.client.id).to.equal('1234');
          expect(request.__mock_store__.utxn.redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.__mock_store__.utxn.req.type).to.equal('code');
          expect(request.__mock_store__.utxn.req.scope).to.equal('email');
          expect(request.__mock_store__.utxn.user.id).to.equal('u123');
          expect(request.__mock_store__.utxn.info.scope).to.equal('read');
          expect(request.__mock_store__.utxn.info.confidential).to.equal(true);
          expect(request.__mock_store__.utxn.locals.beep).to.equal('boop');
        });
      });
    });

    describe('encountering an error while serializing client', () => {
      let server; let immediate; let request; let
        err;

      before(() => {
        server = new Server();
        server.serializeClient((client, done) => done(new Error('something went wrong while serializing client')));
      });

      before(() => {
        immediate = function (client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }

          return done(null, false);
        };
      });

      before((done) => {
        chai.connect.use('express', resume(server, immediate))
          .req((req) => {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize.abc123 = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
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
        expect(err.message).to.equal('something went wrong while serializing client');
      });

      it('should leave transaction', () => {
        expect(request.oauth2).to.be.an('object');
      });

      it('should leave transaction in session', () => {
        expect(request.oauth2.transactionID).to.equal('abc123');
        const tid = request.oauth2.transactionID;
        expect(request.session.authorize[tid]).to.be.an('object');
      });
    });
  });


  describe('prerequisite middleware checks', () => {
    let server;

    before(() => {
      server = new Server();
    });

    describe('handling a request without a transaction', () => {
      let request; let
        err;

      before((done) => {
        chai.connect.use(resume(server, () => {}))
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

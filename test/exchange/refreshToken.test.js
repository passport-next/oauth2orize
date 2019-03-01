const chai = require('chai');
const refreshToken = require('../../lib/exchange/refreshToken');


describe('exchange.refreshToken', () => {
  it('should be named refresh_token', () => {
    expect(refreshToken(() => {}).name).to.equal('refresh_token');
  });

  it('should throw if constructed without a issue callback', () => {
    expect(() => {
      refreshToken();
    }).to.throw(TypeError, 'oauth2orize.refreshToken exchange requires an issue callback');
  });

  describe('issuing an access token', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
        if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }

        return done(null, 's3cr1t');
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token and refresh token', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        if (client.id !== 'c223') { return done(new Error('incorrect client argument')); }
        if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }

        return done(null, 's3cr1t', 'getANotehr');
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c223', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","refresh_token":"getANotehr","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token and params', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        if (client.id !== 'c523') { return done(new Error('incorrect client argument')); }
        if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }

        return done(null, 's3cr1t', { expires_in: 3600 });
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c523', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","expires_in":3600,"token_type":"Bearer"}');
    });
  });

  describe('issuing an access token, null refresh token, and params', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        if (client.id !== 'c323') { return done(new Error('incorrect client argument')); }
        if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }

        return done(null, 's3cr1t', null, { expires_in: 3600 });
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c323', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","expires_in":3600,"token_type":"Bearer"}');
    });
  });

  describe('issuing an access token, refresh token, and params with token_type', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        if (client.id !== 'c423') { return done(new Error('incorrect client argument')); }
        if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }

        return done(null, 's3cr1t', 'blahblag', { token_type: 'foo', expires_in: 3600 });
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c423', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","refresh_token":"blahblag","token_type":"foo","expires_in":3600}');
    });
  });

  describe('issuing an access token based on scope', () => {
    function issue(client, refreshToken, scope, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }
      if (scope.length !== 1) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }

      return done(null, 's3cr1t');
    }

    let response; let
      err;

    before((done) => {
      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { refresh_token: 'refreshing', scope: 'read' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token based on array of scopes', () => {
    function issue(client, refreshToken, scope, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }
      if (scope.length !== 2) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      if (scope[1] !== 'write') { return done(new Error('incorrect scope argument')); }

      return done(null, 's3cr1t');
    }

    let response; let
      err;

    before((done) => {
      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { refresh_token: 'refreshing', scope: 'read write' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token based on scope and body', () => {
    function issue(client, refreshToken, scope, body, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }
      if (scope.length !== 1) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      if (body.audience !== 'https://www.example.com/') { return done(new Error('incorrect body argument')); }

      return done(null, 's3cr1t');
    }

    let response; let
      err;

    before((done) => {
      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { refresh_token: 'refreshing', scope: 'read', audience: 'https://www.example.com/' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token based on authInfo', () => {
    function issue(client, refreshToken, scope, body, authInfo, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }
      if (scope.length !== 1) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      if (body.audience !== 'https://www.example.com/') { return done(new Error('incorrect body argument')); }
      if (authInfo.ip !== '127.0.0.1') { return done(new Error('incorrect authInfo argument')); }

      return done(null, 's3cr1t');
    }

    let response; let
      err;

    before((done) => {
      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { refresh_token: 'refreshing', scope: 'read', audience: 'https://www.example.com/' };
          req.authInfo = { ip: '127.0.0.1' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('not issuing an access token', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        return done(null, false);
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'cUN', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
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
      expect(err.message).to.equal('Invalid refresh token');
      expect(err.code).to.equal('invalid_grant');
      expect(err.status).to.equal(403);
    });
  });

  describe('handling a request without refresh token parameter', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        return done(null, '.ignore');
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c123', name: 'Example' };
          req.body = {};
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
      expect(err.message).to.equal('Missing required parameter: refresh_token');
      expect(err.code).to.equal('invalid_request');
      expect(err.status).to.equal(400);
    });
  });

  describe('encountering an error while issuing an access token', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        return done(new Error('something is wrong'));
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'cXXX', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
        })
        .next((e) => {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error', () => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something is wrong');
    });
  });

  describe('encountering an exception while issuing an access token', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        throw new Error('something was thrown');
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'cTHROW', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
        })
        .next((e) => {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error', () => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something was thrown');
    });
  });

  describe('handling a request without a body', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        return done(null, '.ignore');
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c123', name: 'Example' };
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
  });

  describe('handling a request where scope format is not string', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        return done(null, '.ignore');
      }

      chai.connect.use(refreshToken(issue))
        .req((req) => {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { refresh_token: 'refreshing', scope: ['read', 'write'] };
        })
        .next((e) => {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error', () => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.name).to.equal('TokenError');
      expect(err.message).to.equal('Invalid parameter: scope must be a string');
      expect(err.code).to.equal('invalid_request');
      expect(err.status).to.equal(400);
    });
  });

  describe('with scope separator option', () => {
    describe('issuing an access token based on array of scopes', () => {
      function issue(client, refreshToken, scope, done) {
        if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
        if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }
        if (scope.length !== 2) { return done(new Error('incorrect scope argument')); }
        if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
        if (scope[1] !== 'write') { return done(new Error('incorrect scope argument')); }

        return done(null, 's3cr1t');
      }

      let response; let
        err;

      before((done) => {
        chai.connect.use(refreshToken({ scopeSeparator: ',' }, issue))
          .req((req) => {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { refresh_token: 'refreshing', scope: 'read,write' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should respond with headers', () => {
        expect(response.getHeader('Content-Type')).to.equal('application/json');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
      });

      it('should respond with body', () => {
        expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
      });
    });
  });

  describe('with multiple scope separator option', () => {
    function issue(client, refreshToken, scope, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }
      if (scope.length !== 2) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      if (scope[1] !== 'write') { return done(new Error('incorrect scope argument')); }

      return done(null, 's3cr1t');
    }

    describe('issuing an access token based on scope separated by space', () => {
      let response; let
        err;

      before((done) => {
        chai.connect.use(refreshToken({ scopeSeparator: [' ', ','] }, issue))
          .req((req) => {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { refresh_token: 'refreshing', scope: 'read write' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should respond with headers', () => {
        expect(response.getHeader('Content-Type')).to.equal('application/json');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
      });

      it('should respond with body', () => {
        expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
      });
    });

    describe('issuing an access token based on scope separated by comma', () => {
      let response; let
        err;

      before((done) => {
        chai.connect.use(refreshToken({ scopeSeparator: [' ', ','] }, issue))
          .req((req) => {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { refresh_token: 'refreshing', scope: 'read,write' };
          })
          .end((res) => {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should respond with headers', () => {
        expect(response.getHeader('Content-Type')).to.equal('application/json');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
      });

      it('should respond with body', () => {
        expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
      });
    });
  });

  describe('with user property option issuing an access token', () => {
    let response; let
      err;

    before((done) => {
      function issue(client, refreshToken, done) {
        if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
        if (refreshToken !== 'refreshing') { return done(new Error('incorrect refreshToken argument')); }

        return done(null, 's3cr1t');
      }

      chai.connect.use(refreshToken({ userProperty: 'client' }, issue))
        .req((req) => {
          req.client = { id: 'c123', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
        })
        .end((res) => {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', () => {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', () => {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });
});

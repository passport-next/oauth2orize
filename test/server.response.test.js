const Server = require('../lib/server');


describe('Server', () => {
  describe('handling authorization response with one supported type', () => {
    const server = new Server();
    server.grant('foo', 'response', (txn, res, next) => {
      if (txn.req.scope != 'read') { return next(new Error('something is wrong')); }
      res.end('abc');
    });

    describe('response to supported type', () => {
      let result; let
        err;

      before((done) => {
        const txn = { req: { type: 'foo', scope: 'read' } };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        server._respond(txn, res, (e) => {
          done(new Error('should not be called'));
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should send response', () => {
        expect(result).to.equal('abc');
      });
    });

    describe('response to unsupported type', () => {
      let result; let
        err;

      before((done) => {
        const txn = { req: { type: 'unsupported' } };
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._respond(txn, res, (e) => {
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });
    });
  });

  describe('handling authorization response with one wildcard responder', () => {
    const server = new Server();
    server.grant('*', 'response', (txn, res, next) => {
      res.end('abc');
    });

    describe('response to any type', () => {
      let result; let
        err;

      before((done) => {
        const txn = { req: { type: 'foo', scope: 'read' } };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        server._respond(txn, res, (e) => {
          done(new Error('should not be called'));
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should send response', () => {
        expect(result).to.equal('abc');
      });
    });
  });

  describe('handling authorization response with one wildcard responder and one supported type', () => {
    const server = new Server();
    server.grant('*', 'response', (txn, res, next) => {
      res.star = true;
      next();
    });
    server.grant('foo', 'response', (txn, res, next) => {
      if (!res.star) { return next(new Error('something is wrong')); }
      res.end('abc');
    });

    describe('response to supported type', () => {
      let response; let result; let
        err;

      before((done) => {
        const txn = { req: { type: 'foo', scope: 'read' } };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        response = res;
        server._respond(txn, res, (e) => {
          done(new Error('should not be called'));
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should send response', () => {
        expect(result).to.equal('abc');
      });
    });
  });

  describe('handling authorization response with responder that encounters an error', () => {
    const server = new Server();
    server.grant('foo', 'response', (txn, res, next) => {
      next(new Error('something went wrong'));
    });

    describe('response to supported type', () => {
      let result; let
        err;

      before((done) => {
        const txn = { req: { type: 'foo', scope: 'read' } };
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._respond(txn, res, (e) => {
          err = e;
          done();
        });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });

  describe('handling authorization response with responder that throws an exception', () => {
    const server = new Server();
    server.grant('foo', 'response', (txn, res, next) => {
      throw new Error('something was thrown');
    });

    describe('response to supported type', () => {
      let result; let
        err;

      before((done) => {
        const txn = { req: { type: 'foo', scope: 'read' } };
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._respond(txn, res, (e) => {
          err = e;
          done();
        });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown');
      });
    });
  });

  describe('handling authorization response with no supported types', () => {
    const server = new Server();

    describe('response to unsupported type', () => {
      let err;

      before((done) => {
        const txn = { req: { type: 'foo', scope: 'read' } };
        const res = {};

        server._respond(txn, res, (e) => {
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });
    });
  });
});

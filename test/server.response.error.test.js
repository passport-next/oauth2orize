const Server = require('../lib/server');


describe('Server', () => {
  describe('handling authorization error with one supported type', () => {
    const server = new Server();
    server.grant('foo', 'error', (err, txn, res, next) => {
      if (txn.req.scope != 'read') { return next(new Error('something is wrong')); }
      res.end(`error: ${err.message}`);
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

        server._respondError(new Error('something went wrong'), txn, res, (e) => {
          done(new Error('should not be called'));
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });

      it('should send response', () => {
        expect(result).to.equal('error: something went wrong');
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

        server._respondError(new Error('something went wrong'), txn, res, (e) => {
          err = e;
          done();
        });
      });

      it('should preserve error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });

  describe('handling authorization error with responder that throws an exception', () => {
    const server = new Server();
    server.grant('foo', 'error', (err, txn, res, next) => {
      throw new Error('something else went horribly wrong');
    });


    describe('response to supported type', () => {
      let result; let
        err;

      before((done) => {
        const txn = { req: { type: 'foo' } };
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._respondError(new Error('something went wrong'), txn, res, (e) => {
          err = e;
          done();
        });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something else went horribly wrong');
      });
    });
  });

  describe('handling authorization error with no supported types', () => {
    const server = new Server();


    describe('response to unsupported type', () => {
      let result; let
        err;

      before((done) => {
        const txn = { req: { type: 'foo' } };
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._respondError(new Error('something went wrong'), txn, res, (e) => {
          err = e;
          done();
        });
      });

      it('should preserve error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });
});

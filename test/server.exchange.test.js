const Server = require('../lib/server');


describe('Server', () => {
  describe('with no exchanges', () => {
    const server = new Server();

    describe('handling a request', () => {
      let err;

      before((done) => {
        const req = {};
        const res = {};

        server._exchange(undefined, req, res, (e) => {
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });
    });
  });

  describe('with one exchange registered using a named function', () => {
    const server = new Server();
    server.exchange(code);
    function code(req, res, next) {
      if (req.code != '123') { return next(new Error('something is wrong')); }
      res.end('abc');
    }

    describe('handling a request with supported type', () => {
      let result; let
        err;

      before((done) => {
        const req = { code: '123' };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        server._exchange('code', req, res, (e) => {
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

    describe('handling a request with unsupported type', () => {
      let result; let
        err;

      before((done) => {
        const req = {};
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._exchange('unsupported', req, res, (e) => {
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });
    });

    describe('handling a request with undefined type', () => {
      let result; let
        err;

      before((done) => {
        const req = {};
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._exchange(undefined, req, res, (e) => {
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.undefined;
      });
    });
  });

  describe('with a wildcard exchange registered with null', () => {
    const server = new Server();
    server.exchange(null, (req, res, next) => {
      if (req.code != '123') { return next(new Error('something is wrong')); }
      res.end('abc');
    });

    describe('handling a request with type', () => {
      let result; let
        err;

      before((done) => {
        const req = { code: '123' };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        server._exchange('code', req, res, (e) => {
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

    describe('handling a request without type', () => {
      let result; let
        err;

      before((done) => {
        const req = { code: '123' };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        server._exchange(undefined, req, res, (e) => {
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

  describe('with a wildcard exchange registered with star', () => {
    const server = new Server();
    server.exchange('*', (req, res, next) => {
      if (req.code != '123') { return next(new Error('something is wrong')); }
      res.end('abc');
    });

    describe('handling a request with type', () => {
      let result; let
        err;

      before((done) => {
        const req = { code: '123' };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        server._exchange('code', req, res, (e) => {
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

    describe('handling a request without type', () => {
      let result; let
        err;

      before((done) => {
        const req = { code: '123' };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        server._exchange(undefined, req, res, (e) => {
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

  describe('with one wildcard exchange and one named exchange', () => {
    const server = new Server();
    server.exchange('*', (req, res, next) => {
      if (req.code != '123') { return next(new Error('something is wrong')); }
      req.star = true;
      next();
    });
    server.exchange('code', (req, res, next) => {
      if (!req.star) { return next(new Error('something is wrong')); }
      res.end('abc');
    });

    describe('handling a request with type', () => {
      let result; let
        err;

      before((done) => {
        const req = { code: '123' };
        const res = {};
        res.end = function (data) {
          result = data;
          done();
        };

        server._exchange('code', req, res, (e) => {
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

  describe('with an exchange that encounters an error', () => {
    const server = new Server();
    server.exchange('code', (req, res, next) => {
      next(new Error('something went wrong'));
    });

    describe('handling a request with type', () => {
      let result; let
        err;

      before((done) => {
        const req = { code: '123' };
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._exchange('code', req, res, (e) => {
          err = e;
          return done();
        });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });

  describe('with an exchange that throws an exception', () => {
    const server = new Server();
    server.exchange('code', (req, res, next) => {
      throw new Error('something was thrown');
    });

    describe('handling a request with type', () => {
      let result; let
        err;

      before((done) => {
        const req = {};
        const res = {};
        res.end = function (data) {
          done(new Error('should not be called'));
        };

        server._exchange('code', req, res, (e) => {
          err = e;
          return done();
        });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown');
      });
    });
  });
});

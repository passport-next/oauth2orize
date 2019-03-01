const Server = require('../lib/server');


describe('Server', () => {
  describe('parsing authorization requests with one supported type', () => {
    const server = new Server();
    server.grant('foo', req => ({ foo: req.query.foo }));

    describe('request for supported type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { foo: '1' } };

        server._parse('foo', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(2);
        expect(areq.type).to.equal('foo');
        expect(areq.foo).to.equal('1');
      });
    });

    describe('request for unsupported type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { foo: '1' } };

        server._parse('bar', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse only type', () => {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(1);
        expect(areq.type).to.equal('bar');
      });
    });

    describe('request for undefined type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { foo: '1' } };

        server._parse(undefined, req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should not parse request', () => {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(0);
      });
    });
  });

  describe('parsing authorization requests with one supported type that throws an exception', () => {
    const server = new Server();
    server.grant('foo', (req) => {
      throw new Error('something went horribly wrong');
    });

    describe('request for supported type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { foo: '1' } };

        server._parse('foo', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went horribly wrong');
      });

      it('should not parse object', () => {
        expect(areq).to.be.undefined;
      });
    });
  });

  describe('parsing authorization requests with one wildcard parser', () => {
    const server = new Server();
    server.grant('*', req => ({ star: req.query.star }));

    describe('request for type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { star: 'orion' } };

        server._parse('foo', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(2);
        expect(areq.type).to.equal('foo');
        expect(areq.star).to.equal('orion');
      });
    });
  });

  describe('parsing authorization requests with a wildcard parser and one supported type', () => {
    const server = new Server();
    server.grant('*', req => ({ star: req.query.star }));
    server.grant('bar', req => ({ bar: req.query.bar }));

    describe('request for supported type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { bar: '10', star: 'orion' } };

        server._parse('bar', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(3);
        expect(areq.type).to.equal('bar');
        expect(areq.star).to.equal('orion');
        expect(areq.bar).to.equal('10');
      });
    });
  });

  describe('parsing authorization requests with no supported types', () => {
    const server = new Server();

    describe('request for type', () => {
      let areq; let
        err;

      before((done) => {
        const req = {};

        server._parse('foo', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse only type', () => {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(1);
        expect(areq.type).to.equal('foo');
      });
    });

    describe('request for undefined type', () => {
      let areq; let
        err;

      before((done) => {
        const req = {};

        server._parse(undefined, req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should not parse request', () => {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(0);
      });
    });
  });

  describe('parsing requests with a sync wildcard parser that throws an exception preceeding one supported type', () => {
    const server = new Server();
    server.grant('*', (req) => {
      throw new Error('something went horribly wrong');
    });
    server.grant('bar', req => ({ bar: req.query.bar }));

    describe('request for supported type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { bar: '10', star: 'orion' } };

        server._parse('bar', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went horribly wrong');
      });

      it('should not parse object', () => {
        expect(areq).to.be.undefined;
      });
    });
  });

  describe('parsing authorization requests with an async wildcard parser preceeding one supported type', () => {
    const server = new Server();
    server.grant('*', (req, done) => done(null, { star: req.query.star }));
    server.grant('bar', req => ({ bar: req.query.bar }));

    describe('request for supported type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { bar: '10', star: 'orion' } };

        server._parse('bar', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should not error', () => {
        expect(err).to.be.null;
      });

      it('should parse request', () => {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(3);
        expect(areq.type).to.equal('bar');
        expect(areq.star).to.equal('orion');
        expect(areq.bar).to.equal('10');
      });
    });
  });

  describe('parsing requests with an async wildcard parser that encounters an error preceeding one supported type', () => {
    const server = new Server();
    server.grant('*', (req, done) => done(new Error('something went wrong')));
    server.grant('bar', req => ({ bar: req.query.bar }));

    describe('request for supported type', () => {
      let areq; let
        err;

      before((done) => {
        const req = { query: { bar: '10', star: 'orion' } };

        server._parse('bar', req, (e, ar) => {
          areq = ar;
          err = e;
          done();
        });
      });

      it('should error', () => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });

      it('should not parse object', () => {
        expect(areq).to.be.undefined;
      });
    });
  });
});

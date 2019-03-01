const Server = require('../lib/server');


describe('Server', () => {
  describe('registering a grant module', () => {
    const server = new Server();
    const mod = {};
    mod.name = 'foo';
    mod.request = function (req) {};
    mod.response = function (txn, res, next) {};
    server.grant(mod);

    it('should have one request parser', () => {
      expect(server._reqParsers).to.have.length(1);
      const parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('foo');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });

    it('should have one response handler', () => {
      expect(server._resHandlers).to.have.length(1);
      const handler = server._resHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });

    it('should not have any error handlers', () => {
      expect(server._errHandlers).to.have.length(0);
    });
  });

  describe('registering a grant module with error handler', () => {
    const server = new Server();
    const mod = {};
    mod.name = 'foo';
    mod.request = function (req) {};
    mod.response = function (txn, res, next) {};
    mod.error = function (err, txn, res, next) {};
    server.grant(mod);

    it('should have one request parser', () => {
      expect(server._reqParsers).to.have.length(1);
      const parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('foo');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });

    it('should have one response handler', () => {
      expect(server._resHandlers).to.have.length(1);
      const handler = server._resHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });

    it('should have one error handler', () => {
      expect(server._errHandlers).to.have.length(1);
      const handler = server._errHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(4);
    });
  });

  describe('registering a grant module by type', () => {
    const server = new Server();
    const mod = {};
    mod.name = 'foo';
    mod.request = function (req) {};
    mod.response = function (txn, res, next) {};
    server.grant('bar', mod);

    it('should have one request parser', () => {
      expect(server._reqParsers).to.have.length(1);
      const parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('bar');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });

    it('should have one response handler', () => {
      expect(server._resHandlers).to.have.length(1);
      const handler = server._resHandlers[0];
      expect(handler.type.toString()).to.equal('bar');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });

    it('should not have any error handlers', () => {
      expect(server._errHandlers).to.have.length(0);
    });
  });

  describe('registering a grant module with error handler by type', () => {
    const server = new Server();
    const mod = {};
    mod.name = 'foo';
    mod.request = function (req) {};
    mod.response = function (txn, res, next) {};
    mod.error = function (err, txn, res, next) {};
    server.grant('bar', mod);

    it('should have one request parser', () => {
      expect(server._reqParsers).to.have.length(1);
      const parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('bar');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });

    it('should have one response handler', () => {
      expect(server._resHandlers).to.have.length(1);
      const handler = server._resHandlers[0];
      expect(handler.type.toString()).to.equal('bar');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });

    it('should have one error handler', () => {
      expect(server._errHandlers).to.have.length(1);
      const handler = server._errHandlers[0];
      expect(handler.type.toString()).to.equal('bar');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(4);
    });
  });

  describe('registering a grant parsing function by type', () => {
    const server = new Server();
    const mod = {};
    server.grant('foo', (req) => {});

    it('should have one request parser', () => {
      expect(server._reqParsers).to.have.length(1);
      const parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('foo');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });

    it('should not have any response handlers', () => {
      expect(server._resHandlers).to.have.length(0);
    });

    it('should not have any error handlers', () => {
      expect(server._errHandlers).to.have.length(0);
    });
  });

  describe('registering a grant parsing function by type and phase', () => {
    const server = new Server();
    const mod = {};
    server.grant('foo', 'request', (req) => {});

    it('should have one request parser', () => {
      expect(server._reqParsers).to.have.length(1);
      const parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('foo');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });

    it('should not have any response handlers', () => {
      expect(server._resHandlers).to.have.length(0);
    });

    it('should not have any error handlers', () => {
      expect(server._errHandlers).to.have.length(0);
    });
  });

  describe('registering a wildcard grant parsing function', () => {
    const server = new Server();
    const mod = {};
    server.grant('*', (req) => {});

    it('should have one request parser', () => {
      expect(server._reqParsers).to.have.length(1);
      const parser = server._reqParsers[0];
      expect(parser.type).to.be.null;
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });

    it('should not have any response handlers', () => {
      expect(server._resHandlers).to.have.length(0);
    });

    it('should not have any error handlers', () => {
      expect(server._errHandlers).to.have.length(0);
    });
  });

  describe('registering a grant responding function by type and phase', () => {
    const server = new Server();
    const mod = {};
    server.grant('foo', 'response', (txn, res, next) => {});

    it('should not have any request parsers', () => {
      expect(server._reqParsers).to.have.length(0);
    });

    it('should have one response handler', () => {
      expect(server._resHandlers).to.have.length(1);
      const handler = server._resHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });

    it('should not have any error handlers', () => {
      expect(server._errHandlers).to.have.length(0);
    });
  });

  describe('registering a wildcard grant responding function', () => {
    const server = new Server();
    const mod = {};
    server.grant('*', 'response', (txn, res, next) => {});

    it('should not have any request parsers', () => {
      expect(server._reqParsers).to.have.length(0);
    });

    it('should have one response handler', () => {
      expect(server._resHandlers).to.have.length(1);
      const handler = server._resHandlers[0];
      expect(handler.type).to.be.null;
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });

    it('should not have any error handlers', () => {
      expect(server._errHandlers).to.have.length(0);
    });
  });

  describe('registering a grant error handling function by type and phase', () => {
    const server = new Server();
    const mod = {};
    server.grant('foo', 'error', (err, txn, res, next) => {});

    it('should not have any request parsers', () => {
      expect(server._reqParsers).to.have.length(0);
    });

    it('should not have any response handlers', () => {
      expect(server._resHandlers).to.have.length(0);
    });

    it('should have one error handler', () => {
      expect(server._errHandlers).to.have.length(1);
      const handler = server._errHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(4);
    });
  });

  describe('registering a wildcard error handling function', () => {
    const server = new Server();
    const mod = {};
    server.grant('*', 'error', (err, txn, res, next) => {});

    it('should not have any request parsers', () => {
      expect(server._reqParsers).to.have.length(0);
    });

    it('should not have any response handlers', () => {
      expect(server._resHandlers).to.have.length(0);
    });

    it('should have one error handler', () => {
      expect(server._errHandlers).to.have.length(1);
      const handler = server._errHandlers[0];
      expect(handler.type).to.be.null;
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(4);
    });
  });
});

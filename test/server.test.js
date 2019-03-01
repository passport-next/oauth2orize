const Server = require('../lib/server');


describe('Server', () => {
  describe('newly initialized instance', () => {
    const server = new Server();

    it('should wrap authorization middleware', () => {
      expect(server.authorization).to.be.a('function');
      expect(server.authorization).to.have.length(4);
      expect(server.authorize).to.equal(server.authorization);
    });

    it('should wrap resume middleware', () => {
      expect(server.resume).to.be.a('function');
      expect(server.resume).to.have.length(3);
    });

    it('should wrap decision middleware', () => {
      expect(server.decision).to.be.a('function');
      expect(server.decision).to.have.length(3);
    });

    it('should wrap authorizationErrorHandler middleware', () => {
      expect(server.authorizationErrorHandler).to.be.a('function');
      expect(server.authorizationErrorHandler).to.have.length(1);
      expect(server.authorizeError).to.equal(server.authorizationErrorHandler);
      expect(server.authorizationError).to.equal(server.authorizationErrorHandler);
    });

    it('should wrap token middleware', () => {
      expect(server.token).to.be.a('function');
      expect(server.token).to.have.length(1);
    });

    it('should wrap errorHandler middleware', () => {
      expect(server.errorHandler).to.be.a('function');
      expect(server.errorHandler).to.have.length(1);
    });

    it('should have no request parsers', () => {
      expect(server._reqParsers).to.have.length(0);
    });

    it('should have no response handlers', () => {
      expect(server._resHandlers).to.have.length(0);
    });

    it('should have no error handlers', () => {
      expect(server._errHandlers).to.have.length(0);
    });

    it('should have no exchanges', () => {
      expect(server._exchanges).to.have.length(0);
    });

    it('should have no serializers or deserializers', () => {
      expect(server._serializers).to.have.length(0);
      expect(server._deserializers).to.have.length(0);
    });
  });

  describe('#authorization', () => {
    const server = new Server();

    it('should create function handler', () => {
      const handler = server.authorization(() => {});
      expect(handler).to.be.an('function');
      expect(handler).to.have.length(3);
    });
  });

  describe('#resume', () => {
    const server = new Server();

    it('should create handler stack with two functions', () => {
      const handler = server.resume(() => {});
      expect(handler).to.be.an('array');
      expect(handler).to.have.length(2);
      expect(handler[0]).to.be.a('function');
      expect(handler[0]).to.have.length(3);
      expect(handler[1]).to.be.a('function');
      expect(handler[1]).to.have.length(3);
    });

    it('should create function handler when transaction loader is disabled', () => {
      const handler = server.resume({ loadTransaction: false }, () => {});
      expect(handler).to.be.an('function');
      expect(handler).to.have.length(3);
    });

    it('should create handler stack with custom transaction loader', () => {
      function loadTransaction(req, res, next) {}
      const handler = server.resume({ loadTransaction }, () => {});
      expect(handler).to.be.an('array');
      expect(handler).to.have.length(2);
      expect(handler[0]).to.be.a('function');
      expect(handler[0].name).to.equal('loadTransaction');
      expect(handler[0]).to.have.length(3);
      expect(handler[1]).to.be.a('function');
      expect(handler[1]).to.have.length(3);
    });

    it('should create handler stack with custom transaction loader using non-object signature', () => {
      function loadTransaction(req, res, next) {}
      const handler = server.resume(loadTransaction, () => {}, () => {});
      expect(handler).to.be.an('array');
      expect(handler).to.have.length(2);
      expect(handler[0]).to.be.a('function');
      expect(handler[0].name).to.equal('loadTransaction');
      expect(handler[0]).to.have.length(3);
      expect(handler[1]).to.be.a('function');
      expect(handler[1]).to.have.length(3);
    });
  });

  describe('#decision', () => {
    const server = new Server();

    it('should create handler stack with two functions', () => {
      const handler = server.decision();
      expect(handler).to.be.an('array');
      expect(handler).to.have.length(2);
      expect(handler[0]).to.be.a('function');
      expect(handler[0]).to.have.length(3);
      expect(handler[1]).to.be.a('function');
      expect(handler[1]).to.have.length(3);
    });

    it('should create function handler when transaction loader is disabled', () => {
      const handler = server.decision({ loadTransaction: false });
      expect(handler).to.be.an('function');
      expect(handler).to.have.length(3);
    });
  });

  describe('#authorizationErrorHandler', () => {
    const server = new Server();

    it('should create function error handler', () => {
      const handler = server.authorizationErrorHandler();
      expect(handler).to.be.an('array');
      expect(handler).to.have.length(2);
      expect(handler[0]).to.be.a('function');
      expect(handler[0]).to.have.length(4);
      expect(handler[1]).to.be.a('function');
      expect(handler[1]).to.have.length(4);
    });
  });

  describe('#token', () => {
    const server = new Server();

    it('should create function handler', () => {
      const handler = server.token();
      expect(handler).to.be.an('function');
      expect(handler).to.have.length(3);
    });
  });

  describe('#errorHandler', () => {
    const server = new Server();

    it('should create function error handler', () => {
      const handler = server.errorHandler();
      expect(handler).to.be.an('function');
      expect(handler).to.have.length(4);
    });
  });
});

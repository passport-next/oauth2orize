const Server = require('../lib/server');


describe('Server', () => {
  describe('#serializeClient', () => {
    describe('no serializers', () => {
      const server = new Server();

      describe('serializing', () => {
        let obj; let
          err;

        before((done) => {
          server.serializeClient({ id: '1', name: 'Foo' }, (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should error', () => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('Failed to serialize client. Register serialization function using serializeClient().');
        });
      });
    });

    describe('one serializer', () => {
      const server = new Server();
      server.serializeClient((client, done) => {
        done(null, client.id);
      });

      describe('serializing', () => {
        let obj; let
          err;

        before((done) => {
          server.serializeClient({ id: '1', name: 'Foo' }, (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should not error', () => {
          expect(err).to.be.null;
        });

        it('should serialize', () => {
          expect(obj).to.equal('1');
        });
      });
    });

    describe('multiple serializers', () => {
      const server = new Server();
      server.serializeClient((client, done) => {
        done('pass');
      });
      server.serializeClient((client, done) => {
        done(null, '#2');
      });
      server.serializeClient((client, done) => {
        done(null, '#3');
      });

      describe('serializing', () => {
        let obj; let
          err;

        before((done) => {
          server.serializeClient({ id: '1', name: 'Foo' }, (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should not error', () => {
          expect(err).to.be.null;
        });

        it('should serialize', () => {
          expect(obj).to.equal('#2');
        });
      });
    });

    describe('serializer that encounters an error', () => {
      const server = new Server();
      server.serializeClient((client, done) => done(new Error('something went wrong')));

      describe('serializing', () => {
        let obj; let
          err;

        before((done) => {
          server.serializeClient({ id: '1', name: 'Foo' }, (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should error', () => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('something went wrong');
        });
      });
    });

    describe('serializer that throws an exception', () => {
      const server = new Server();
      server.serializeClient((client, done) => {
        throw new Error('something was thrown');
      });

      describe('serializing', () => {
        let obj; let
          err;

        before((done) => {
          server.serializeClient({ id: '1', name: 'Foo' }, (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should error', () => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('something was thrown');
        });
      });
    });
  }); // #serializeClient

  describe('#deserializeClient', () => {
    describe('no deserializers', () => {
      const server = new Server();

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should error', () => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('Failed to deserialize client. Register deserialization function using deserializeClient().');
        });
      });
    });

    describe('one deserializer', () => {
      const server = new Server();
      server.deserializeClient((id, done) => {
        done(null, { id });
      });

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should not error', () => {
          expect(err).to.be.null;
        });

        it('should deserialize', () => {
          expect(obj.id).to.equal('1');
        });
      });
    });

    describe('multiple deserializers', () => {
      const server = new Server();
      server.deserializeClient((id, done) => {
        done('pass');
      });
      server.deserializeClient((id, done) => {
        done(null, { id: '#2' });
      });
      server.deserializeClient((id, done) => {
        done(null, { id: '#3' });
      });

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should not error', () => {
          expect(err).to.be.null;
        });

        it('should deserialize', () => {
          expect(obj.id).to.equal('#2');
        });
      });
    });

    describe('one deserializer to null', () => {
      const server = new Server();
      server.deserializeClient((id, done) => {
        done(null, null);
      });

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should not error', () => {
          expect(err).to.be.null;
        });

        it('should invalidate client', () => {
          expect(obj).to.be.false;
        });
      });
    });

    describe('one deserializer to false', () => {
      const server = new Server();
      server.deserializeClient((id, done) => {
        done(null, false);
      });

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should not error', () => {
          expect(err).to.be.null;
        });

        it('should invalidate client', () => {
          expect(obj).to.be.false;
        });
      });
    });

    describe('multiple deserializers to null', () => {
      const server = new Server();
      server.deserializeClient((obj, done) => {
        done('pass');
      });
      server.deserializeClient((id, done) => {
        done(null, null);
      });
      server.deserializeClient((obj, done) => {
        done(null, { id: '#3' });
      });

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should not error', () => {
          expect(err).to.be.null;
        });

        it('should invalidate client', () => {
          expect(obj).to.be.false;
        });
      });
    });

    describe('multiple deserializers to false', () => {
      const server = new Server();
      server.deserializeClient((obj, done) => {
        done('pass');
      });
      server.deserializeClient((id, done) => {
        done(null, false);
      });
      server.deserializeClient((obj, done) => {
        done(null, { id: '#3' });
      });

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should not error', () => {
          expect(err).to.be.null;
        });

        it('should invalidate client', () => {
          expect(obj).to.be.false;
        });
      });
    });

    describe('deserializer that encounters an error', () => {
      const server = new Server();
      server.deserializeClient((obj, done) => done(new Error('something went wrong')));

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should error', () => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('something went wrong');
        });
      });
    });

    describe('deserializer that throws an exception', () => {
      const server = new Server();
      server.deserializeClient((obj, done) => {
        throw new Error('something was thrown');
      });

      describe('deserializing', () => {
        let obj; let
          err;

        before((done) => {
          server.deserializeClient('1', (e, o) => {
            err = e;
            obj = o;
            return done();
          });
        });

        it('should error', () => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('something was thrown');
        });
      });
    });
  }); // #deserializeClient
});

const BadRequestError = require('../../lib/errors/badrequesterror');


describe('BadRequestError', () => {
  describe('constructed without a message', () => {
    const err = new BadRequestError();

    it('should have default properties', () => {
      expect(err.message).to.be.undefined;
    });

    it('should format correctly', () => {
      // expect(err.toString()).to.equal('BadRequestError');
      expect(err.toString().indexOf('BadRequestError')).to.equal(0);
    });

    it('should have status', () => {
      expect(err.status).to.equal(400);
    });

    it('should inherits from Error', () => {
      expect(err).to.be.instanceof(Error);
    });
  });

  describe('constructed with a message', () => {
    const err = new BadRequestError('Bad request');

    it('should have default properties', () => {
      expect(err.message).to.equal('Bad request');
    });

    it('should format correctly', () => {
      expect(err.toString()).to.equal('BadRequestError: Bad request');
    });

    it('should have status', () => {
      expect(err.status).to.equal(400);
    });
  });
});

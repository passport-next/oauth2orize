const ForbiddenError = require('../../lib/errors/forbiddenerror');


describe('ForbiddenError', () => {
  describe('constructed without a message', () => {
    const err = new ForbiddenError();

    it('should have default properties', () => {
      expect(err.message).to.be.undefined;
    });

    it('should format correctly', () => {
      // expect(err.toString()).to.equal('ForbiddenError');
      expect(err.toString().indexOf('ForbiddenError')).to.equal(0);
    });

    it('should have status', () => {
      expect(err.status).to.equal(403);
    });

    it('should inherits from Error', () => {
      expect(err).to.be.instanceof(Error);
    });
  });

  describe('constructed with a message', () => {
    const err = new ForbiddenError('Forbidden');

    it('should have default properties', () => {
      expect(err.message).to.equal('Forbidden');
    });

    it('should format correctly', () => {
      expect(err.toString()).to.equal('ForbiddenError: Forbidden');
    });

    it('should have status', () => {
      expect(err.status).to.equal(403);
    });
  });
});

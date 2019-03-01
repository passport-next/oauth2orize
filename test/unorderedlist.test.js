const UnorderedList = require('../lib/unorderedlist');


describe('UnorderedList', () => {
  describe('constructed with a single element array', () => {
    const ul = new UnorderedList(['a']);

    it('should have correct length', () => {
      expect(ul).to.have.length(1);
      expect(ul._items[0]).to.equal('a');
    });

    it('should convert to string', () => {
      expect(ul.toString()).to.equal('a');
    });

    it('should be equal to list with same item', () => {
      const other = new UnorderedList(['a']);
      expect(ul.equalTo(other)).to.be.true;
    });

    it('should be equal to array with same item', () => {
      expect(ul.equalTo(['a'])).to.be.true;
    });

    it('should not be equal to list with superset of item', () => {
      const other = new UnorderedList(['a', 'b']);
      expect(ul.equalTo(other)).to.be.false;
    });

    it('should check if it contains element', () => {
      expect(ul.contains('a')).to.be.true;
      expect(ul.contains('b')).to.be.false;
    });

    it('should check if it contains any element', () => {
      expect(ul.containsAny(['a'])).to.be.true;
      expect(ul.containsAny(['b'])).to.be.false;
      expect(ul.containsAny(['1', 'a'])).to.be.true;
      expect(ul.containsAny(['2', 'b'])).to.be.false;
    });
  });

  describe('constructed with a multiple element array', () => {
    const ul = new UnorderedList(['a', 'b']);

    it('should have correct length', () => {
      expect(ul).to.have.length(2);
      expect(ul._items[0]).to.equal('a');
      expect(ul._items[1]).to.equal('b');
    });

    it('should convert to string', () => {
      expect(ul.toString()).to.equal('a b');
    });

    it('should be equal to list with same set of items', () => {
      const other = new UnorderedList(['a', 'b']);
      expect(ul.equalTo(other)).to.be.true;
    });

    it('should be equal to list with same set of items in different order', () => {
      const other = new UnorderedList(['b', 'a']);
      expect(ul.equalTo(other)).to.be.true;
    });

    it('should not be equal to list with subset of items', () => {
      const other = new UnorderedList(['a']);
      expect(ul.equalTo(other)).to.be.false;
    });

    it('should not be equal to list with superset of items', () => {
      const other = new UnorderedList(['a', 'b', 'c']);
      expect(ul.equalTo(other)).to.be.false;
    });

    it('should check if it contains element', () => {
      expect(ul.contains('a')).to.be.true;
      expect(ul.contains('b')).to.be.true;
      expect(ul.contains('c')).to.be.false;
    });

    it('should check if it contains any element', () => {
      expect(ul.containsAny(['a'])).to.be.true;
      expect(ul.containsAny(['b'])).to.be.true;
      expect(ul.containsAny(['c'])).to.be.false;
      expect(ul.containsAny(['1', 'a'])).to.be.true;
      expect(ul.containsAny(['2', 'b'])).to.be.true;
      expect(ul.containsAny(['3', 'c'])).to.be.false;
    });
  });

  describe('constructed with string', () => {
    const ul = new UnorderedList('foobar');

    it('should have correct length', () => {
      expect(ul).to.have.length(1);
      expect(ul._items[0]).to.equal('foobar');
    });

    it('should convert to string', () => {
      expect(ul.toString()).to.equal('foobar');
    });
  });

  describe('constructed with space separated string', () => {
    const ul = new UnorderedList('foo bar');

    it('should have correct length', () => {
      expect(ul).to.have.length(2);
      expect(ul._items[0]).to.equal('foo');
      expect(ul._items[1]).to.equal('bar');
    });

    it('should convert to string', () => {
      expect(ul.toString()).to.equal('foo bar');
    });
  });
});

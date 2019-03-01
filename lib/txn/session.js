/**
 * Module dependencies.
 */
const crypto = require('crypto');
const AuthorizationError = require('../errors/authorizationerror');
const BadRequestError = require('../errors/badrequesterror');
const ForbiddenError = require('../errors/forbiddenerror');


function SessionStore() {
  this.legacy = true;
}

SessionStore.prototype.load = function load(server, options, req, cb) {
  const field = options.transactionField || 'transaction_id';
  const key = options.sessionKey || 'authorize';

  if (!req.session) { return cb(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }
  if (!req.session[key]) { return cb(new ForbiddenError('Unable to load OAuth 2.0 transactions from session')); }

  const query = req.query || {};
  const body = req.body || {};
  const tid = query[field] || body[field];

  if (!tid) { return cb(new BadRequestError(`Missing required parameter: ${field}`)); }
  const txn = req.session[key][tid];
  if (!txn) { return cb(new ForbiddenError(`Unable to load OAuth 2.0 transaction: ${tid}`)); }

  const self = this;
  return server.deserializeClient(txn.client, (err, client) => {
    if (err) { return cb(err); }
    if (!client) {
      // At the time the request was initiated, the client was validated.
      // Since then, however, it has been invalidated.  The transaction will
      // be invalidated and no response will be sent to the client.
      return self.remove(options, req, tid, (err2) => {
        if (err2) { return cb(err2); }
        return cb(new AuthorizationError('Unauthorized client', 'unauthorized_client'));
      });
    }

    txn.transactionID = tid;
    txn.client = client;
    return cb(null, txn);
  });
};

SessionStore.prototype.store = function store(server, options, req, txn, cb) {
  const lenTxnID = options.idLength || 8;
  const key = options.sessionKey || 'authorize';

  if (!req.session) { return cb(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }

  return server.serializeClient(txn.client, (err, obj) => {
    if (err) { return cb(err); }

    const tid = crypto.randomBytes(lenTxnID).toString('hex');
    txn.client = obj;

    // store transaction in session
    req.session[key] = req.session[key] || {};
    const txns = req.session[key];
    txns[tid] = txn;

    return cb(null, tid);
  });
};

SessionStore.prototype.update = function update(server, options, req, tid, txn, cb) {
  const key = options.sessionKey || 'authorize';

  server.serializeClient(txn.client, (err, obj) => {
    if (err) { return cb(err); }

    txn.client = obj;

    // store transaction in session
    req.session[key] = req.session[key] || {};
    const txns = req.session[key];
    txns[tid] = txn;

    return cb(null, tid);
  });
};

SessionStore.prototype.remove = function remove(options, req, tid, cb) {
  const key = options.sessionKey || 'authorize';

  if (!req.session) { return cb(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }

  if (req.session[key]) {
    delete req.session[key][tid];
  }

  return cb();
};


module.exports = SessionStore;

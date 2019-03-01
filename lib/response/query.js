const url = require('url');
const AuthorizationError = require('../errors/authorizationerror');

/**
* Authorization Response parameters are encoded in the query string added to the redirect_uri when
* redirecting back to the Client.
* */
module.exports = function query(txn, res, params) {
  const parsed = url.parse(txn.redirectURI, true);
  delete parsed.search;
  Object.keys(params).forEach((k) => {
    parsed.query[k] = params[k];
  });

  const location = url.format(parsed);
  return res.redirect(location);
};

exports = module.exports;

exports.validate = function validate(txn) {
  if (!txn.redirectURI) { throw new AuthorizationError('Unable to issue redirect for OAuth 2.0 transaction', 'server_error'); }
};

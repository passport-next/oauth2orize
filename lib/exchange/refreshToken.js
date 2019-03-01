/**
 * Module dependencies.
 */
const _ = require('lodash');
const TokenError = require('../errors/tokenerror');


/**
 * Refresh previously issued access tokens.
 *
 * This exchange middleware is used to by clients to refresh an access token by
 * using a refresh token issued by the server.
 *
 * Callbacks:
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(client, refreshToken, scope, done) { ... }
 *
 * `client` is the authenticated client instance attempting to obtain an access
 * token.  `refreshToken` is the refresh token issued by the server.  `scope` is
 * the scope of access requested by the client, which must not include any scope
 * not originally granted.  `done` is called to issue an access token:
 *
 *     done(err, accessToken, refreshToken, params)
 *
 * `accessToken` is the access token that will be sent to the client.  An
 * optional `refreshToken` will be sent to the client, if the server chooses to
 * implement support for this functionality.  Any additional `params` will be
 * included in the response.  If an error occurs, `done` should be invoked with
 * `err` set in idomatic Node.js fashion.
 *
 * Options:
 *
 *     userProperty    property of `req` which contains the authenticated client (default: 'user')
 *     scopeSeparator  separator used to demarcate scope values (default: ' ')
 *
 * Examples:
 *
 *     server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken,
 *      scope, done) {
 *       AccessToken.create(client, refreshToken, scope, function(err, accessToken) {
 *         if (err) { return done(err); }
 *         done(null, accessToken);
 *       });
 *     }));
 *
 * References:
 *  - [Refreshing an Access Token](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-6)
 *
 * @param {Object} options
 * @param {Function} issue
 * @api public
 */
module.exports = function r(options, issue) {
  if (typeof options === 'function') {
    issue = options;
    options = undefined;
  }
  options = options || {};

  if (!issue) { throw new TypeError('oauth2orize.refreshToken exchange requires an issue callback'); }

  const userProperty = options.userProperty || 'user';

  // For maximum flexibility, multiple scope spearators can optionally be
  // allowed.  This allows the server to accept clients that separate scope
  // with either space or comma (' ', ',').  This violates the specification,
  // but achieves compatibility with existing client libraries that are already
  // deployed.
  let separators = options.scopeSeparator || ' ';
  if (!Array.isArray(separators)) {
    separators = [separators];
  }

  // eslint-disable-next-line camelcase
  return function refresh_token(req, res, next) {
    if (!req.body) { return next(new Error('OAuth2orize requires body parsing. Did you forget app.use(express.bodyParser())?')); }

    // The 'user' property of `req` holds the authenticated user.  In the case
    // of the token endpoint, the property will contain the OAuth 2.0 client.
    const client = req[userProperty];
    const refreshToken = req.body.refresh_token;
    let { scope } = req.body;

    if (!refreshToken) { return next(new TokenError('Missing required parameter: refresh_token', 'invalid_request')); }

    if (scope) {
      if (typeof scope !== 'string') {
        return next(new TokenError('Invalid parameter: scope must be a string', 'invalid_request'));
      }

      for (let i = 0, len = separators.length; i < len; i++) {
        const separated = scope.split(separators[i]);
        // only separate on the first matching separator.  this allows for a sort
        // of separator "priority" (ie, favor spaces then fallback to commas)
        if (separated.length > 1) {
          scope = separated;
          break;
        }
      }
      if (!Array.isArray(scope)) { scope = [scope]; }
    }

    function issued(err, accessToken, refreshToken2, params) {
      if (err) { return next(err); }
      if (!accessToken) { return next(new TokenError('Invalid refresh token', 'invalid_grant')); }
      if (refreshToken2 && typeof refreshToken2 === 'object') {
        params = refreshToken2;
        refreshToken2 = null;
      }

      const tok = {};
      tok.access_token = accessToken;
      if (refreshToken2) { tok.refresh_token = refreshToken2; }
      if (params) { _.merge(tok, params); }
      tok.token_type = tok.token_type || 'Bearer';

      const json = JSON.stringify(tok);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      return res.end(json);
    }

    try {
      const arity = issue.length;
      if (arity === 6) {
        return issue(client, refreshToken, scope, req.body, req.authInfo, issued);
      }
      if (arity === 5) {
        return issue(client, refreshToken, scope, req.body, issued);
      }
      if (arity === 4) {
        return issue(client, refreshToken, scope, issued);
      }
      // arity == 3
      return issue(client, refreshToken, issued);
    } catch (ex) {
      return next(ex);
    }
  };
};

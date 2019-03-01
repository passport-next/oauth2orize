/**
 * Module dependencies.
 */
const _ = require('lodash');
const AuthorizationError = require('../errors/authorizationerror');


module.exports = function r(server, options, immediate, complete) {
  if (typeof options === 'function') {
    complete = immediate;
    immediate = options;
    options = undefined;
  }
  options = options || {};

  if (!server) { throw new TypeError('oauth2orize.resume middleware requires a server argument'); }
  if (!immediate) { throw new TypeError('oauth2orize.resume middleware requires an immediate function'); }

  const userProperty = options.userProperty || 'user';


  return function resume(req, res, next) {
    if (!req.oauth2) { return next(new Error('OAuth2orize requires transaction support. Did you forget oauth2orize.transactionLoader(...)?')); }

    req.oauth2.user = req[userProperty];
    if (res.locals) {
      req.oauth2.locals = req.oauth2.locals || {};
      _.merge(req.oauth2.locals, res.locals);
    }

    function immediated(err, allow, info, locals) {
      if (err) { return next(err); }
      if (allow) {
        req.oauth2.res = info || {};
        req.oauth2.res.allow = true;
        if (locals) {
          req.oauth2.locals = req.oauth2.locals || {};
          _.merge(req.oauth2.locals, locals);
        }

        // proxy end() to delete the transaction
        const { end } = res;
        res.end = function e(chunk, encoding) {
          if (server._txnStore.legacy === true) {
            server._txnStore.remove(options, req, req.oauth2.transactionID, () => {});
          } else {
            server._txnStore.remove(req, req.oauth2.transactionID, () => {});
          }

          res.end = end;
          res.end(chunk, encoding);
        };
        req.oauth2._endProxied = true;


        function completing(cb) {
          if (!complete) { return cb(); }
          return complete(req, req.oauth2, cb);
        }

        return server._respond(req.oauth2, res, completing, (err2) => {
          if (err2) { return next(err2); }
          return next(new AuthorizationError(`Unsupported response type: ${req.oauth2.req.type}`, 'unsupported_response_type'));
        });
      }
      req.oauth2.info = info;
      if (locals) {
        req.oauth2.locals = req.oauth2.locals || {};
        _.merge(req.oauth2.locals, locals);
      }

      function updated(err2, tid) {
        if (err2) { return next(err2); }
        req.oauth2.transactionID = tid;
        return next();
      }

      if (server._txnStore.legacy === true) {
        const txn = {};
        txn.protocol = 'oauth2';
        txn.client = req.oauth2.client;
        txn.redirectURI = req.oauth2.redirectURI;
        txn.req = req.oauth2.req;
        txn.info = info;

        return server._txnStore.update(server, options, req, req.oauth2.transactionID,
          txn, updated);
      }
      return server._txnStore.update(req, req.oauth2.transactionID, req.oauth2, updated);
    }

    try {
      const arity = immediate.length;
      if (arity === 7) {
        return immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope,
          req.oauth2.req.type, req.oauth2.req, req.oauth2.locals, immediated);
      }
      if (arity === 6) {
        return immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope,
          req.oauth2.req.type, req.oauth2.req, immediated);
      }
      if (arity === 5) {
        return immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope,
          req.oauth2.req.type, immediated);
      }
      if (arity === 4) {
        return immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, immediated);
      }
      if (arity === 3) {
        return immediate(req.oauth2.client, req.oauth2.user, immediated);
      }
      // arity == 2
      return immediate(req.oauth2, immediated);
    } catch (ex) {
      return next(ex);
    }
  };
};

module.exports = function eh(server, options) {
  options = options || {};

  if (!server) { throw new TypeError('oauth2orize.authorizationErrorHandler middleware requires a server argument'); }

  return function authorizationErrorHandler(err, req, res, next) {
    if (!req.oauth2) { return next(err); }

    if (req.oauth2.transactionID && !req.oauth2._endProxied) {
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
    }

    return server._respondError(err, req.oauth2, res, err2 => next(err2));
  };
};

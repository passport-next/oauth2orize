/**
 * Module dependencies.
 */
const fs = require('fs');
const path = require('path');
const Server = require('./server');


/**
 * Create an OAuth 2.0 server.
 *
 * @return {Server}
 * @api public
 */
function createServer(options) {
  const server = new Server(options);
  return server;
}

// expose createServer() as the module
module.exports = createServer;
exports = module.exports;

/**
 * Export `.createServer()`.
 */
exports.createServer = createServer;


/**
 * Export middleware.
 */
exports.errorHandler = require('./middleware/errorHandler');

/**
 * Auto-load bundled grants.
 */
exports.grant = {};

fs.readdirSync(`${__dirname}/grant`).forEach((filename) => {
  if (/\.js$/.test(filename)) {
    const name = path.basename(filename, '.js');
    // eslint-disable-next-line
    const load = function () { return require(`./grant/${name}`); };
    exports.grant.__defineGetter__(name, load);
  }
});

// alias grants
exports.grant.authorizationCode = exports.grant.code;
exports.grant.implicit = exports.grant.token;

/**
 * Auto-load bundled exchanges.
 */
exports.exchange = {};

fs.readdirSync(`${__dirname}/exchange`).forEach((filename) => {
  if (/\.js$/.test(filename)) {
    const name = path.basename(filename, '.js');
    // eslint-disable-next-line
    const load = function () { return require(`./exchange/${name}`); };
    exports.exchange.__defineGetter__(name, load);
  }
});

// alias exchanges
exports.exchange.code = exports.exchange.authorizationCode;

/**
 * Export errors.
 */
exports.OAuth2Error = require('./errors/oauth2error');
exports.AuthorizationError = require('./errors/authorizationerror');
exports.TokenError = require('./errors/tokenerror');

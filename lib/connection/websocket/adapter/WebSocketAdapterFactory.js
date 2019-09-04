const OpenfeedCodec = require('./OpenfeedCodec');

module.exports = (() => {
	'use strict';

	/**
	 * An interface for creating WebSocket {@link WebSocketAdapter} instances.
	 *
	 * @public
	 * @interface
	 */
	class WebSocketAdapterFactory {
		constructor(config,codec) {
			this._config = config;
			this._codec = codec;
		}

		build(host) {
			return null;
		}

		toString() {
			return '[WebSocketAdapterFactory]';
		}
	}

	return WebSocketAdapterFactory;
})();
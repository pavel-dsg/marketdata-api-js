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
		constructor(config) {
			this._config = config;
			if(this._config && this._config.isOpenfeed()) {
				this._codec = new OpenfeedCodec();
			}
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
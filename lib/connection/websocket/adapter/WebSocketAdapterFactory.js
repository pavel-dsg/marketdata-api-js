module.exports = (() => {
	'use strict';

	/**
	 * An interface for creating WebSocket {@link WebSocketAdapter} instances.
	 *
	 * @public
	 * @interface
	 */
	class WebSocketAdapterFactory {
		constructor() {

		}

		build(host) {
			return null;
		}

		/**
	    * Set a custom codec.
	    * 
	 	* @param {Codec} codec 
	 	*/
		setCodec(codec) {
			this._codec = codec;
		}

		toString() {
			return '[WebSocketAdapterFactory]';
		}
	}

	return WebSocketAdapterFactory;
})();
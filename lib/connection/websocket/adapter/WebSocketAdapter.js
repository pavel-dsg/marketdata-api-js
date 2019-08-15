module.exports = (() => {
	'use strict';

	/**
	 * An interface for establishing and interacting with a WebSocket connection.
	 *
	 * @public
	 * @private
	 * @interface
	 */
	class WebSocketAdapter {
		constructor(host,codec) {
			this._codec = codec;
		}

		get CONNECTING() {
			return null;
		}

		get OPEN() {
			return null;
		}

		get CLOSING() {
			return null;
		}

		get CLOSED() {
			return null;
		}

		get binaryType() {
			return null;
		}

		set binaryType(value) {
			return;
		}

		get readyState() {
			return null;
		}

		set readyState(value) {
			return;
		}

		get onopen() {
			return null;
		}

		set onopen(callback) {
			return;
		}

		get onclose() {
			return null;
		}

		set onclose(callback) {
			return;
		}

		get onmessage() {
			return null;
		}

		set onmessage(callback) {
			return;
		}

		send(message) {
			return;
		}

		close() {
			return;
		}

		getEncoder() {
			if(this._codec) {
				return this._codec;
			}
			let encoder = {
				encode: (data) => {}
			};
			return encoder;
		}

		getDecoder() {
			return this._codec;
		}

		toString() {
			return '[WebSocketAdapter]';
		}
	}

	return WebSocketAdapter;
})();
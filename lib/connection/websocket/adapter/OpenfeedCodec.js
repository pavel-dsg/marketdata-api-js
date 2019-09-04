
const protobuf = require("protobufjs");
const LoggerFactory = require('./../../../logging/LoggerFactory');

module.exports = (() => {
	'use strict';

	const logger = LoggerFactory.getLogger('@barchart/marketdata-api-js');


	/**
	 */
	class OpenfeedCodec {
		constructor(config) {
			this._config = config;
			this._protoFile = __dirname + "/../../../openfeed/proto/openfeed_api.proto";
			if (this._config && this._config.protoPath) {
				this._protoFile = config.protoPath;
			}
			logger.info("Using protobuf file: " + this._protoFile);
			// Requests
			this.OpenfeedGatewayRequestType = null;
			// Responses
			this.OpenfeedGatewayMessageType = null;
			// Load Protobuf Definitions
			protobuf.load(this._protoFile, (err, root) => {
				if (err)
					throw err;
				this.OpenfeedGatewayRequestType = root.lookupType("org.openfeed.OpenfeedGatewayRequest");
				this.OpenfeedGatewayMessageType = root.lookupType("org.openfeed.OpenfeedGatewayMessage");
			});
		}

		init() {
			// Load Protobuf Definitions
			return protobuf.load(this._protoFile).then( (root) => {
				logger.info("Loaded protobuf files: ",this._protoFile);
				this.OpenfeedGatewayRequestType = root.lookupType("org.openfeed.OpenfeedGatewayRequest");
				this.OpenfeedGatewayMessageType = root.lookupType("org.openfeed.OpenfeedGatewayMessage");
			}).catch ( (err) => {
				logger.error("Could not load protobuf files: ",err);
			});
		}

		createMessage(o) {
			return this.OpenfeedGatewayRequestType.create(o);
		}
		encode(protoMessage) {
			var buffer = this.OpenfeedGatewayRequestType.encodeDelimited(protoMessage).finish();
			return buffer;
		}

		decode(data) {
			return this.OpenfeedGatewayMessageType.decodeDelimited(new Uint8Array(data));
		}
	}

	return OpenfeedCodec;
})();


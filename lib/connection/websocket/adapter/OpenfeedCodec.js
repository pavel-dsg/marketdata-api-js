
const protobuf = require("protobufjs");
const LoggerFactory = require('./../../../logging/LoggerFactory');

module.exports = (() => {
	'use strict';

	const logger = LoggerFactory.getLogger('@barchart/marketdata-api-js');
	const protoFile = __dirname + "/../../../openfeed/proto/openfeed_api.proto";

	// Requests
	var OpenfeedGatewayRequestType = null;
	// Responses
	var OpenfeedGatewayMessageType = null;

	
	logger.info("Using protobuf file: "+ protoFile);

	protobuf.load(protoFile, (err, root) => {
		if (err)
			throw err;
		OpenfeedGatewayRequestType = root.lookupType("org.openfeed.OpenfeedGatewayRequest");
		OpenfeedGatewayMessageType = root.lookupType("org.openfeed.OpenfeedGatewayMessage");
	});
		
	/**
	 */
	class OpenfeedCodec {
		createMessage(o) {
			return OpenfeedGatewayRequestType.create(o);
		}
		encode(protoMessage) {
			var buffer = OpenfeedGatewayRequestType.encodeDelimited(protoMessage).finish();
			return buffer;
		}
		
		decode(data) {
			return OpenfeedGatewayMessageType.decodeDelimited(new Uint8Array(data));
		}
	}

	return OpenfeedCodec;
})();



const LoggerFactory = require('./../logging/LoggerFactory');

module.exports = (() => {
	'use strict';

	const logger = LoggerFactory.getLogger('@barchart/marketdata-api-js');

	class OpenfeedConverter {
		
		/**
		 * Converts from Openfeed to internal domain model.
		 * 
		 * @param {OpenfeedMessage} ofMessage
		 * @returns Internal model
		 */
		convert(ofMessage) {
			const message = {
				message : ofMessage,
				type : null
			};
			switch(ofMessage.data) {
				case "loginResponse":
					break;
				case "logoutResponse":
					break;
				case "instrumentResponse":
					break;
				case "instrumentReferenceResponse":
					break;
				case "subscriptionResponse":
					break;
				case "heartBeat":
					break;
				case "instrumentDefinition":
					break;
				case "marketSnapshot":
					break;
				case "marketUpdate":
					break;
				default:
			}
			return message;
		}
	}

	return OpenfeedConverter;
})();


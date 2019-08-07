
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

		}
	}

	return OpenfeedConverter;
})();


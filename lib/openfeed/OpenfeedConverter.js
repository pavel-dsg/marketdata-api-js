
const LoggerFactory = require('./../logging/LoggerFactory');

module.exports = (() => {
	'use strict';

	const logger = LoggerFactory.getLogger('@barchart/marketdata-api-js');

	class OpenfeedConverter {

		/**
		 * Converts from Openfeed to internal domain model.
		 * 
		 * @param {InstrumentDefinition} definition
		 * @param {OpenfeedMessage} ofMessage
		 * @returns Internal model
		 */
		convert(definition, ofMessage) {
			const message = {
				message: ofMessage,
				type: null
			};
			// logger.debug("< " + JSON.stringify(ofMessage, null, 4));
			switch (ofMessage.data) {
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
					message.type = 'TIMESTAMP';
					// TODO use real date
					message.timestamp = new Date();
					break;
				case "instrumentDefinition":
					break;
				case "marketSnapshot":
					message.symbol = definition.symbol;
					break;
				case "marketUpdate":
					message.symbol = definition.symbol;
					this.handleMarketUpdate(definition, message, ofMessage);
					break;
				default:
			}
			return message;
		}


		handleMarketUpdate(definition,message, ofMessage) {
			logger.info("< " + JSON.stringify(ofMessage));
			let update = ofMessage.marketUpdate;
			switch (update.data) {
				case "bbo":
					message.bidPrice = update.bbo.bidPrice;
					message.bidSize = update.bbo.bidQuantity;
					message.askPrice = update.bbo.offerPrice;
					message.askSize = update.bbo.offerQuantity;
					// TODO
					message.day = 1;
					message.session = 'G';
					message.time = new Date();
					message.type = 'TOB';
					break;
				case "trades":
					break;
				case "open":
					break;
				case "high":
					break;
				case "low":
					break;
				case "close":
					break;
				case "prevClose":
					break;
				case "last":
					break;
				default:
			}
		}

		convertPrice(price) {

		}
	}

	return OpenfeedConverter;
})();


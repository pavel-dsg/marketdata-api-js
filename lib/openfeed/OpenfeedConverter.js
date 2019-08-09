
const LoggerFactory = require('./../logging/LoggerFactory');

module.exports = (() => {
	'use strict';

	const log = LoggerFactory.getLogger('@barchart/marketdata-api-js');

	class OpenfeedConverter {


		/**
		 * Converts from Openfeed to internal domain model.
		 * 
		 * @param {String} ddfSymbol;
		 * @param {InstrumentDefinition} definition
		 * @param {OpenfeedMessage} ofMessage
		 * @returns Array of {Message} objects
		 */
		convert(ddfSymbol, definition, ofMessage) {
			let ret = [];
			// log.info("< " + JSON.stringify(ofMessage, null, 4));
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
					ret = this._handleHeartBeat(message, ofMessage);
					break;
				case "instrumentDefinition":
					break;
				case "marketSnapshot":
					ret = this._handleMarketSnapshot(ddfSymbol,definition, ofMessage);
					break;
				case "marketUpdate":
					ret = this._handleMarketUpdate(ddfSymbol,definition, ofMessage);
					break;
				default:
			}
			return ret;
		}

		/**
		 * Convert Snapshot depth levels to DDF Book
		 * 
		 * @param {} ddfSymbol 
		 * @param {*} definition 
		 * @param {*} ofMessage 
		 */
		convertSnapshotDepth(ddfSymbol, definition, ofMessage) {
			let snapshot = ofMessage.marketSnapshot;
			const message = {
				// message: ofMessage,
				symbol: ddfSymbol,
				type: 'BOOK'
			};
			log.info("Depth TODO");
			return message;
		}

		convertSnapshotCumulativeVolume(ddfSymbol, definition, ofMessage) {
			let snapshot = ofMessage.marketSnapshot;
			const message = {
				// message: ofMessage,
				symbol: ddfSymbol,
				type: 'REFRESH_CUMULATIVE_VOLUME'
			};
			log.info("Cumm Volumne TODO");
			return message;
		}

		_createMessage(type) {
			let message = {
				// message: ofMessage,
				type: type
			};
			return message
		}
		_convertToDate(nanos) {
			return new Date(this._convertToMs(nanos));
		}

		/**
		 * Convert Nanos to Ms
		 */
		_convertToMs(nanos) {
			return Math.floor(nanos / (1000 * 1000));
		}

		_convertPrice(def, price) {
			return price;
		}

		_handleHeartBeat(message, fMessage) {
			let hb = ofMessage.heartBeat;
			let m = this._createMessage('TIMESTAMP');
			message.timestamp = _convertToDate(hb.transactionTime);
			return [message];
		}

		_handleMarketSnapshot(ddfSymbol,definition, ofMessage) {
			let message = this._createMessage('REFRESH_QUOTE');
			message.symbol = ddfSymbol;

			let snapshot = ofMessage.marketSnapshot;
			message.name = definition.description;
			message.exchange = definition.exchangeCode;
			// TODO
			message.unitcode = 'A';
			message.pointValue = 1;
			message.tickIncrement = 1;
			message.lastUpdate = new Date(snapshot.transactionTime / (1000 * 1000));
			message.bidPrice = snapshot.bbo.bidPrice;
			message.bidSize = snapshot.bbo.bidQuantity;
			message.askPrice = snapshot.bbo.offerPrice;
			message.askSize = snapshot.bbo.offerQuantity;
			// message.mode

			// Sessions
			const sessions = {};
			if (snapshot.previousSession) {
				log.info("TODO previous session");
			}
			if (snapshot.tSession) {
				log.info("TODO T session");
			}
			return [message];


		}

		_handleMarketUpdate(ddfSymbol,definition, ofMessage) {
			let message = this._createMessage('REFRESH_QUOTE');
			message.symbol = ddfSymbol;

			let update = ofMessage.marketUpdate;
			message.time = this._convertToDate(update.transactionTime);
			switch (update.data) {
				case "news":
					break;
				case "clearBook":
					break;
				case "instrumentStatus":
					break;
				case "bbo":
					message.bidPrice = this._convertPrice(definition, update.bbo.bidPrice);
					message.bidSize = update.bbo.bidQuantity;
					message.askPrice = this._convertPrice(definition, update.bbo.offerPrice);
					message.askSize = update.bbo.offerQuantity;
					// TODO
					message.day = 1;
					message.session = 'G';
					message.time = new Date();
					message.type = 'TOB';
					break;
				case "depthPriceLevel":
					message.type = 'BOOK';
					break;
				case "depthOrder":
					break;
				case "index":
					break;
				case "trades":
					// TODO support multiples
					message.type = 'TRADE';
					//message.type = 'TRADE_OUT_OF_SEQUENCE'; TODO
					break;
				case "open":
					message.type = 'OPEN';
					message.value = this._convertPrice(definition, update.open.price);
					break;
				case "high":
					message.type = 'HIGH';
					break;
				case "low":
					message.type = 'LOW';
					break;
				case "close":
					break;
				case "prevClose":
					break;
				case "last":
					break;
				case "yearHigh":
					break;
				case "yearLow":
					break;
				case "volume":
					message.type = 'VOLUME';
					// message.type ='VOLUME_YESTERDAY';
					break;
				case "settlement":
					message.type = 'SETTLEMENT';
					break;
				case "openInterest":
					message.type = 'OPEN_INTEREST';
					break;
				case "vwap":
					message.type = 'VWAP';
					break;
				case "dividendsIncomeDistributions":
					break;
				case "numberOfTrades":
					break;
				case "monetaryValue":
					break;
				case "capitalDistributions":
					break;
				case "sharesOutstanding":
					break;
				case "netAssetValue":
					break;
				case "marketSummary":
					let ms = update.marketSummary;
					if (ms.open) {
						message.openPrice = this._convertPrice(definition, ms.open.price);
					}
					message.highPrice = this._convertPrice(definition, ms.high.price);
					message.lowPrice = this._convertPrice(definition, ms.low.price);
					message.lastPrice = this._convertPrice(definition, ms.last.price);
					message.bidPrice = this._convertPrice(definition, ms.bbo.bidPrice);
					message.askPrice = this._convertPrice(definition, ms.bbo.askPrice);
					message.previousPrice = this._convertPrice(definition, ms.prevClose.price);
					message.settlementPrice = this._convertPrice(definition, ms.settlement.price);
					message.volume = _ms.volume.volume;
					message.openInterest = ms.openInterest.volume;
					//TODO
					// message.day = ary[14].substr(0, 1);
					// message.session = ary[14].substr(1, 1);
					message.type = 'REFRESH_DDF';
					break;
				default:
			}
			return [message];
		}


	}

	return OpenfeedConverter;
})();


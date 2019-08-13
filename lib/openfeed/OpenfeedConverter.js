
const LoggerFactory = require('./../logging/LoggerFactory');
const TradingDay = require('./Openfeed').TradingDay;

module.exports = (() => {
	'use strict';

	const log = LoggerFactory.getLogger('@barchart/marketdata-api-js');

	class OpenfeedConverter {
		constructor() {
			// Will be set from MarketSnapshot.instrumentStatus and MarketUpdate.instrumentStatus
			this._tradingStatus;
			this._tradeDate;
		}

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
			// log.info("< " + JSON.stringify(ofMessage));
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
					ret = this._handleMarketSnapshot(ddfSymbol, definition, ofMessage);
					break;
				case "marketUpdate":
					ret = this._handleMarketUpdate(ddfSymbol, definition, ofMessage);
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

		/**
		 * Update message for MarketUpdate
		 * 
		 * @param {} ddfSymbol 
		 * @param {*} definition 
		 * @param {*} update 
		 */
		_createMessageUpdate(ddfSymbol, definition, update) {
			// TODO ddf specific fields
			let message = {
				symbol: ddfSymbol,
				time: this._convertToDate(update.transactionTime)
			};
			message.record = '2';
			// message.subrecord = msg.substr(pos + 1, 1);
			// TODO
			message.unitcode = '8';
			message.exchange = definition.exchangeCode;
			// TODO
			message.delay = 10;
			// TODO
			message.session = ' ';
			message.day = this._getTradingDay();
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
			return price / def.priceDenominator;
		}

		_convertTradeDate(openfeedTradeDate) {
			let year = Math.floor(openfeedTradeDate / 10000);
			let month = Math.floor((openfeedTradeDate - (year * 10000)) / 100);
			let dayOfMonth = Math.floor(openfeedTradeDate - (year * 10000) - (month * 100));
			month -= 1;
			return new Date(year, month, dayOfMonth);
		}

		_getTradingDay() {
			let dayOfMonth = this._tradeDate.getDate();
			let ddfDayCode = TradingDay[dayOfMonth];
			return ddfDayCode;
		}

		_getTradingDay(tradeDate) {
			let dt = this._convertTradeDate(tradeDate);
			return TradingDay[dt.getDate()];
		}

		_handleHeartBeat(message, fMessage) {
			let hb = ofMessage.heartBeat;
			let m = this._createMessage('TIMESTAMP');
			message.timestamp = this._convertToDate(hb.transactionTime);
			return [message];
		}

		_handleMarketSnapshot(ddfSymbol, definition, ofMessage) {
			let ret = [];
			let snapshot = ofMessage.marketSnapshot;
			// Instrument Status 
			if (snapshot.instrumentStatus) {
				this._convertInstrumentStatus(snapshot.instrumentStatus);
			}

			let message = this._createMessage('REFRESH_QUOTE');

			message.symbol = ddfSymbol;
			message.name = definition.description;
			// TODO support multiple exchanges for Trades and Quote
			message.exchange = definition.exchangeCode;
			// TODO
			message.unitcode = '8';
			message.pointValue = 1;
			message.tickIncrement = 1;
			// TODO flag
			// message.flag = XX
			message.lastUpdate = this._convertToDate(snapshot.transactionTime);
			// BBO
			message.bidPrice = this._convertPrice(snapshot.bbo.bidPrice);
			message.bidSize = snapshot.bbo.bidQuantity;
			message.askPrice = this._convertPrice(snapshot.bbo.offerPrice);
			message.askSize = snapshot.bbo.offerQuantity;
			// TODO
			message.mode = 'R';

			//
			// Sessions
			//
			const sessions = {};
			// Create combined/current session
			const s = {
				id: "combined"
			};
			s.day = this._getTradingDay();
			if (snapshot.last) {
				s.lastPrice = this._convertPrice(definition, snapshot.last.price);
			}
			if (snapshot.prevClose) {
				s.previousPrice = this._convertPrice(definition, snapshot.prevClose.price);
			}
			if (snapshot.open) {
				s.openPrice = this._convertPrice(definition, snapshot.open.price);
			}
			if (snapshot.high) {
				s.highPrice = this._convertPrice(definition, snapshot.high.price);
			}
			if (snapshot.low) {
				s.lowPrice = this._convertPrice(definition, snapshot.low.price);
			}
			// TODO Trade Size?
			// if (snapshot.low) {
			// 	s.tradeSize = this._convertPrice(definition, snapshot.low.price);
			// }
			if (snapshot.numberTrades) {
				s.numberOfTrades = this._convertPrice(definition, snapshot.numberTrades.numberTrades);
			}
			if (snapshot.settlement) {
				s.settlementPrice = this._convertPrice(definition, snapshot.settlement.price);
			}
			if (snapshot.volume) {
				s.volume = this._convertPrice(definition, snapshot.volume.volume);
			}
			if (snapshot.openInterest) {
				s.openInterest = this._convertPrice(definition, snapshot.openInterest.price);
			}
			s.timeStamp = this._convertToDate(snapshot.transactionTime);
			// TODO ?
			if (snapshot.tradeTime) {
				s.tradeTime = "";
			}
			// Add to sessions
			if (s.id)
				sessions[s.id] = s;


			// Previous Session
			if (snapshot.previousSession) {
				let p = snapshot.previousSession;
				const s = {
					id: "previous"
				};
				s.day = this._getTradingDay(p.tradeDate);
				
			}

			// T Session
			if (snapshot.tSession) {
				log.info("TODO T session");
			}

			ret.push(message);

			// Depth
			// Book message
			if (snapshot.priceLevels) {
				let depthMessage = this._handleDepthPriceLevels(ddfSymbol, definition, ofMessage);
				if (depthMessage) {
					ret.push(depthMessage);
				}
			}

			return ret;
		}

		_handleDepthPriceLevels(ddfSymbol, definition, ofMessage) {
			// TODO
			let message = this._createMessage('BOOK');
			return null;

		}


		_convertInstrumentStatus(instrumentStatus) {
			this._tradingStatus = instrumentStatus.tradingStatus;
			this._tradeDate = this._convertTradeDate(instrumentStatus.tradeDate);
		}

		_handleMarketUpdate(ddfSymbol, definition, ofMessage) {
			let update = ofMessage.marketUpdate;
			let ret = [];
			let message = this._createMessageUpdate(ddfSymbol, definition, update);

			switch (update.data) {
				case "news":
					log.info("News: ", JSON.stringify(update.news));
					break;
				case "clearBook":
					log.info("clearBook: ", JSON.stringify(update.clearBook));
					break;
				case "instrumentStatus":
					log.info("instrumentStatus: ", JSON.stringify(update.instrumentStatus));
					this._convertInstrumentStatus(update.instrumentStatus);
					break;
				case "bbo":
					message.bidPrice = this._convertPrice(definition, update.bbo.bidPrice);
					message.bidSize = update.bbo.bidQuantity;
					message.askPrice = this._convertPrice(definition, update.bbo.offerPrice);
					message.askSize = update.bbo.offerQuantity;
					message.day = this._getTradingDay();
					// TODO
					message.session = ' ';
					message.time = this._convertToDate(update.transactionTime);
					message.type = 'TOB';
					ret.push(message);
					break;
				case "depthPriceLevel":
					// TODO
					// log.debug("depthPriceLevel: ", JSON.stringify(update.depthPriceLevel));
					let depthMessage = this._handleDepthPriceLevels(ddfSymbol, definition, ofMessage);
					if (depthMessage) {
						ret.push(depthMessage);
					}
					// message.type = 'BOOK';
					break;
				case "depthOrder":
					// Not supported in Openfeed yet.
					log.info("depthOrder: ", JSON.stringify(update.depthOrder));
					message.type = 'BOOK';
					break;
				case "index":
					log.info("index: ", JSON.stringify(update.index));
					break;
				case "trades":
					log.info("Trades: ", JSON.stringify(update.trades.trades));
					update.trades.trades.forEach((entry) => {
						if (entry.trade) {
							let message = this._createMessageUpdate(ddfSymbol, definition, update);
							message.tradePrice = this._convertPrice(definition, entry.trade.price);
							message.tradeSize = entry.trade.quantity;
							// TODO use trade date from message
							message.day = this._getTradingDay();
							// TODO
							message.session = ' ';
							// Side?
							message.side = entry.trade.side;
							message.type = 'TRADE';
							ret.push(message);
						}
						else if (entry.tradeCorrection) {
							// TODO
						}
						else if (entry.tradeCancel) {
							// TODO
						}
					});
					// TODO Z trade
					//message.type = 'TRADE_OUT_OF_SEQUENCE'; TODO
					break;
				case "open":
					log.info("open: ", JSON.stringify(update.open));
					message.subrecord = '0';
					message.type = 'OPEN';
					message.value = this._convertPrice(definition, update.open.price);
					message.element = 'A';
					message.modifier = '';
					ret.push(message);
					break;
				case "high":
					log.info("high: ", JSON.stringify(update.high));
					message.subrecord = '0';
					message.value = this._convertPrice(definition, update.openInterest.price);
					message.element = '5';
					message.modifier = '';
					message.type = 'HIGH';
					ret.push(message);
					break;
				case "low":
					log.info("low: ", JSON.stringify(update.low));
					message.subrecord = '0';
					message.value = this._convertPrice(definition, update.openInterest.price);
					message.element = '6';
					message.modifier = '';
					message.type = 'LOW';
					ret.push(message);
					break;
				case "close":
					log.info("close: ", JSON.stringify(update.close));
					break;
				case "prevClose":
					log.info("prevClose: ", JSON.stringify(update.prevClose));
					break;
				case "last":
					log.info("last: ", JSON.stringify(update.last));
					break;
				case "yearHigh":
					log.info("yearHigh: ", JSON.stringify(update.yearHigh));
					break;
				case "yearLow":
					log.info("yearLow: ", JSON.stringify(update.yearLow));
					break;
				case "volume":
					log.info("volume: ", JSON.stringify(update.volume));
					message.subrecord = '0';
					message.value = this._convertPrice(definition, update.volume.price);
					message.element = '7';
					message.modifier = '';
					message.type = 'VOLUME';
					ret.push(message);
					// TODO
					// message.type ='VOLUME_YESTERDAY';
					// TODO Cumulative volume
					break;
				case "settlement":
					log.info("settlement: ", JSON.stringify(update.settlement));
					message.subrecord = '0';
					message.value = this._convertPrice(definition, update.openInterest.price);
					// TODO 'd'
					message.element = 'D';
					message.modifier = '';
					message.type = 'SETTLEMENT';
					ret.push(message);
					break;
				case "openInterest":
					log.info("openInterest: ", JSON.stringify(update.openInterest));
					message.subrecord = '0';
					message.value = this._convertPrice(definition, update.openInterest.price);
					message.element = 'C';
					message.modifier = '';
					message.type = 'OPEN_INTEREST';
					ret.push(message);
					break;
				case "vwap":
					log.info("vwap: ", JSON.stringify(update.vwap));
					message.subrecord = '0';
					message.value = this._convertPrice(definition, update.openInterest.price);
					message.element = 'V';
					message.modifier = '';
					message.type = 'VWAP';
					ret.push(message);
					break;
				case "dividendsIncomeDistributions":
					log.info("dividendsIncomeDistributions: ", JSON.stringify(update.dividendsIncomeDistributions));
					break;
				case "numberOfTrades":
					log.info("numberOfTrades: ", JSON.stringify(update.numberOfTrades));
					break;
				case "monetaryValue":
					log.info("monetaryValue: ", JSON.stringify(update.monetaryValue));
					break;
				case "capitalDistributions":
					log.info("capitalDistributions: ", JSON.stringify(update.capitalDistributions));
					break;
				case "sharesOutstanding":
					log.info("sharesOutstanding: ", JSON.stringify(update.sharesOutstanding));
					break;
				case "netAssetValue":
					log.info("netAssetValue: ", JSON.stringify(update.netAssetValue));
					break;
				case "marketSummary":
					log.info("marketSummary: ", JSON.stringify(update.marketSummary));
					let ms = update.marketSummary;
					if (ms.open) {
						message.openPrice = this._convertPrice(definition, ms.open.price);
					}
					if (ms.high) {
						message.highPrice = this._convertPrice(definition, ms.high.price);
					}
					if (ms.low) {
						message.lowPrice = this._convertPrice(definition, ms.low.price);
					}
					if (ms.last) {
						message.lastPrice = this._convertPrice(definition, ms.last.price);
					}
					if (ms.bbo) {
						message.bidPrice = this._convertPrice(definition, ms.bbo.bidPrice);
					}
					if (ms.bbo) {
						message.askPrice = this._convertPrice(definition, ms.bbo.askPrice);
					}
					if (ms.prevClose) {
						message.previousPrice = this._convertPrice(definition, ms.prevClose.price);
					}
					if (ms.settlement) {
						message.settlementPrice = this._convertPrice(definition, ms.settlement.price);
					}
					if (ms.volume) {
						message.volume = _ms.volume.volume;
					}
					if (ms.openInterest) {
						message.openInterest = ms.openInterest.volume;
					}
					// 
					message.type = 'REFRESH_DDF';
					ret.push(message);
					break;
				default:
			}
			return ret;
		}


	}

	return OpenfeedConverter; 2932500000000
})();


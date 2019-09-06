const LoggerFactory = require('./../logging/LoggerFactory');
const TradingDay = require('./Openfeed').TradingDay,
    BookSide = require('./Openfeed').BookSide,
    Service = require('./Openfeed').Service,
    InstrumentTradingStatus = require('./Openfeed').InstrumentTradingStatus;

module.exports = (() => {
    'use strict';

    const log = LoggerFactory.getLogger('@barchart/marketdata-api-js');
    const BASE_CODE_DEFAULT = '8';
    const DELAY_DEFAULT  = 10;

    class OpenfeedConverter {
        constructor() {
            // Will be set from MarketSnapshot.instrumentStatus and MarketUpdate.instrumentStatus
            // Tracks trading date and status
            this._ddfSymbolToOpenfeedState = {};
        }

        /**
         * Converts from Openfeed to internal domain model.
         * 
         * @param {OpenfeedMessage} ofMessage
         * @param {String} ddfSymbol;
         * @param {InstrumentDefinition} definition
         * @returns Array of {Message} objects
         */
        convert(ofMessage, ddfSymbol, definition) {
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
                    ret = this._handleHeartBeat(ofMessage);
                    break;
                case "instrumentDefinition":
                    break;
                case "marketSnapshot":
                    ret = this._handleMarketSnapshot(ddfSymbol, definition, ofMessage);
                    break;
                case "marketUpdate":
                    ret = this._handleMarketUpdate(ddfSymbol, definition, ofMessage);
                    break;
                case "cumulativeVolume":
                    ret = this._handleCumulativeVolume(ddfSymbol, definition, ofMessage);
                    break;
                case "ohlc":
                    ret = this._handleOhlc(ddfSymbol, definition, ofMessage);
                    break;
                default:
            }
            return ret;
        }

        _handleCumulativeVolume(ddfSymbol, definition, ofMessage) {
            let update = ofMessage.cumulativeVolume;
            let ret = [];
            let message = this._createMessage('REFRESH_CUMULATIVE_VOLUME');
            message.symbol = ddfSymbol;
            message.unitcode = BASE_CODE_DEFAULT;
            message.tickIncrement = definition.minimumPriceIncrement;

            // TODO Populate

            ret.push[message];
            return ret;
        }

        _handleOhlc(ddfSymbol, definition, ofMessage) {
            let update = ofMessage.cumulativeVolume;
            let ret = [];
            let message = this._createMessage('OHLC');
            message.symbol = ddfSymbol;

            ret.push[message];
            return ret;
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
            let message = {
                symbol: ddfSymbol,
                time: this._convertToDate(update.transactionTime)
            };
            message.record = '2';
            message.unitcode = BASE_CODE_DEFAULT;
            message.exchange = definition.barchartExchangeCode;
            // Don't have in Openfeed
            message.delay = DELAY_DEFAULT;
            message.day = this._getTradingDay(ddfSymbol);
            // Default 
            message.session = ' ';
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

        _getTradingDay(ddfSymbol) {
            let state = this._getState(ddfSymbol);
            let tradeDate = state.tradeDate;
            let dayOfMonth = tradeDate.getDate();
            let ddfDayCode = TradingDay[dayOfMonth];
            return ddfDayCode;
        }

        _getTradingDayFromOpenfeedDate(tradeDate) {
            let dt = this._convertTradeDate(tradeDate);
            return TradingDay[dt.getDate()];
        }

        _handleHeartBeat(ofMessage) {
            let hb = ofMessage.heartBeat;
            let m = this._createMessage('TIMESTAMP');
            m.timestamp = this._convertToDate(hb.transactionTime);
            return [m];
        }

        _handleMarketSnapshot(ddfSymbol, definition, ofMessage) {
            let ret = [];
            let snapshot = ofMessage.marketSnapshot;

            // Instrument Status - Sets tradeDate and Status
            if (snapshot.instrumentStatus && snapshot.instrumentStatus.tradeDate) {
                this._convertInstrumentStatus(ddfSymbol, snapshot.instrumentStatus);
            }
            else if (snapshot.tradeDate) {
                // Use top level tradeDate
                let state = this._getState(ddfSymbol);
                state["tradeDate"] = this._convertTradeDate(snapshot.tradeDate);
            }

            let message = this._createMessage('REFRESH_QUOTE');

            message.symbol = ddfSymbol;
            message.name = definition.description;
            message.exchange = definition.barchartExchangeCode;
            // BaseCode, default to '8'
            message.unitcode = BASE_CODE_DEFAULT;
            message.pointValue = definition.contractPointValue;
            message.tickIncrement = definition.minimumPriceIncrement;
            // Flag which is from trading status (c,p,s)
            message.flag = this._getFlag(ddfSymbol);
            message.lastUpdate = this._convertToDate(snapshot.transactionTime);
            // BBO
            message.bidPrice = this._convertPrice(snapshot.bbo.bidPrice);
            message.bidSize = snapshot.bbo.bidQuantity;
            message.askPrice = this._convertPrice(snapshot.bbo.offerPrice);
            message.askSize = snapshot.bbo.offerQuantity;
            // Permissioning Mode 
            message.mode = this._getMode(snapshot.service);


            //
            // Sessions
            //
            const sessions = {};

            // Create combined/current session
            let source = snapshot;
            const s = {
                id: "combined",
                day: this._getTradingDay(ddfSymbol)
            };
            this._createSession(definition, s, source);
            // Add to sessions
            sessions[s.id] = s;

            // Previous Session
            if (snapshot.previousSession) {
                let source = snapshot.previousSession;
                const s = {
                    id: "previous",
                    day: this._getTradingDayFromOpenfeedDate(source.tradeDate)
                };
                this._createSession(definition, s, source);
                sessions[s.id] = s;
            }

            // T Session
            if (snapshot.tSession) {
                let source = snapshot.tSession;
                let tradingDay = this._getTradingDayFromOpenfeedDate(source.tradeDate)
                const s = {
                    id: "session_" + tradingDay + "_T",
                    day: tradingDay
                };
                this._createSession(definition, s, source);
                sessions[s.id] = s;
            }
            // Session Logic
            this._adjustSessions(sessions, message);
            ret.push(message);

            // Depth
            if (snapshot.priceLevels) {
                let depthMessage = this._handleSnapshotDepthPriceLevels(ddfSymbol, definition, snapshot.priceLevels);
                if (depthMessage) {
                    ret.push(depthMessage);
                }
            }

            return ret;
        }

        _createSession(definition, session, source) {
            if (source.last) {
                session.lastPrice = this._convertPrice(definition, source.last.price);
            }
            if (source.prevClose) {
                session.previousPrice = this._convertPrice(definition, source.prevClose.price);
            }
            if (source.open) {
                session.openPrice = this._convertPrice(definition, source.open.price);
            }
            if (source.high) {
                session.highPrice = this._convertPrice(definition, source.high.price);
            }
            if (source.low) {
                session.lowPrice = this._convertPrice(definition, source.low.price);
            }
            // tradeSize and tradeTime 
            if (source.last) {
                session.tradeSize = source.last.quantity;
                if (source.last.transactionTime) {
                    session.tradetime = this._convertToDate(source.last.transactionTime);
                }
                else {
                    session.tradetime = this._convertToDate(source.transactionTime);
                }
            }
            if (source.numberOfTrades) {
                session.numberOfTrades = source.numberOfTrades.numberTrades;
            }
            if (source.settlement) {
                session.settlementPrice = this._convertPrice(definition, source.settlement.price);
            }
            if (source.volume) {
                session.volume = source.volume.volume;
            }
            if (source.openInterest) {
                session.openInterest = source.openInterest.volume;
            }
            session.timeStamp = this._convertToDate(source.transactionTime);

        }

        _adjustSessions(sessions, message) {
            const premarket = typeof (sessions.combined.lastPrice) === 'undefined';
            const postmarket = !premarket && typeof (sessions.combined.settlementPrice) !== 'undefined';

            const session = premarket ? sessions.previous : sessions.combined;

            if (sessions.combined.previousPrice) {
                message.previousPrice = sessions.combined.previousPrice;
            }
            else {
                message.previousPrice = sessions.previous.previousPrice;
            }

            if (session.lastPrice)
                message.lastPrice = session.lastPrice;
            if (session.openPrice)
                message.openPrice = session.openPrice;
            if (session.highPrice)
                message.highPrice = session.highPrice;
            if (session.lowPrice)
                message.lowPrice = session.lowPrice;
            if (session.tradeSize)
                message.tradeSize = session.tradeSize;
            if (session.numberOfTrades)
                message.numberOfTrades = session.numberOfTrades;
            if (session.settlementPrice)
                message.settlementPrice = session.settlementPrice;
            if (session.volume)
                message.volume = session.volume;
            if (session.openInterest)
                message.openInterest = session.openInterest;
            if (session.id === 'combined' && sessions.previous.openInterest)
                message.openInterest = sessions.previous.openInterest;
            if (session.timeStamp)
                message.timeStamp = session.timeStamp;
            if (session.tradeTime)
                message.tradeTime = session.tradeTime;

            // 2016/10/29, BRI. We have a problem where we don't "roll" quotes
            // for futures. For example, LEZ16 doesn't "roll" the settlementPrice
            // to the previous price -- so, we did this on the open message (2,0A).
            // Eero has another idea. Perhaps we are setting the "day" improperly
            // here. Perhaps we should base the day off of the actual session
            // (i.e. "session" variable) -- instead of taking it from the "combined"
            // session.

            if (sessions.combined.day)
                message.day = session.day;
            if (premarket && typeof (message.flag) === 'undefined')
                message.flag = 'p';

            const p = sessions.previous;

            message.previousPreviousPrice = p.previousPrice;
            message.previousSettlementPrice = p.settlementPrice;
            message.previousOpenPrice = p.openPrice;
            message.previousHighPrice = p.highPrice;
            message.previousLowPrice = p.lowPrice;
            message.previousTimeStamp = p.timeStamp;

            if (sessions.combined.day) {
                const sessionFormT = 'session_' + sessions.combined.day + '_T';

                if (sessions.hasOwnProperty(sessionFormT)) {
                    const t = sessions[sessionFormT];

                    const lastPriceT = t.lastPrice;

                    if (lastPriceT) {
                        const tradeTimeT = t.tradeTime;
                        const tradeSizeT = t.tradeSize;

                        let sessionIsEvening;

                        if (tradeTimeT) {
                            const noon = new Date(tradeTimeT.getFullYear(), tradeTimeT.getMonth(), tradeTimeT.getDate(), 12, 0, 0, 0);

                            sessionIsEvening = tradeTimeT.getTime() > noon.getTime();
                        } else {
                            sessionIsEvening = false;
                        }

                        message.sessionT = sessionIsEvening;

                        const sessionIsCurrent = premarket || sessionIsEvening;

                        if (sessionIsCurrent) {
                            message.lastPriceT = lastPriceT;
                        }

                        if (premarket || postmarket) {
                            message.session = 'T';

                            if (sessionIsCurrent) {
                                if (tradeTimeT) {
                                    message.tradeTime = tradeTimeT;
                                }

                                if (tradeSizeT) {
                                    message.tradeSize = tradeSizeT;
                                }
                            }

                            if (premarket) {
                                if (t.volume) {
                                    message.volume = t.volume;
                                }

                                if (t.previousPrice) {
                                    message.previousPrice = t.previousPrice;
                                }
                            }
                        }
                    }
                }
            }
        }

        _handleSnapshotDepthPriceLevels(ddfSymbol, definition, priceLevels) {
            let bids = this._getBookSide(ddfSymbol, BookSide.BID);
            let asks = this._getBookSide(ddfSymbol, BookSide.OFFER);

            let message = this._createMessage('BOOK');
            message.symbol = ddfSymbol;
            message.unitcode = BASE_CODE_DEFAULT;
            message.subrecord = 'B';
            message.exchange = definition.barchartExchangeCode;
            message.asks = [];
            message.bids = [];

            let askSize = 0;
            let bidSize = 0;
            priceLevels.forEach((level) => {
                if (level.side === BookSide.BID) {
                    bidSize += 1;
                    let priceLevel = this._buildPriceLevel(definition, level);
                    bids[level.level] = priceLevel;
                    message.bids.push(priceLevel);
                }
                else if (level.side === BookSide.OFFER) {
                    askSize += 1;
                    let priceLevel = this._buildPriceLevel(definition, level);
                    asks[level.level] = priceLevel;
                    message.asks.push(priceLevel);
                }
            });
            message.askDepth = askSize;
            message.bidDepth = bidSize;

            return message;

        }

        _handleUpdateDepthPriceLevels(ddfSymbol, definition, depthPriceLevel) {
            let bids = this._getBookSide(ddfSymbol, BookSide.BID);
            let asks = this._getBookSide(ddfSymbol, BookSide.OFFER);

            let message = this._createMessage('BOOK');
            message.symbol = ddfSymbol;
            message.subrecord = 'B';
            // TODO Adjust for real DDF exchange
            message.exchange = definition.exchangeCode;
            // TODO
            message.unitcode = BASE_CODE_DEFAULT;
            message.asks = [];
            message.bids = [];

            depthPriceLevel.levels.forEach((entry) => {
                let level = null;
                switch (entry.data) {
                    case "addPriceLevel":
                        level = entry.addPriceLevel;
                        if (level.side === BookSide.BID) {
                            let priceLevel = this._buildPriceLevel(definition, level);
                            bids[level.level] = priceLevel;
                        }
                        else if (level.side === BookSide.OFFER) {
                            let priceLevel = this._buildPriceLevel(definition, level);
                            asks[level.level] = priceLevel;
                        }
                        break;
                    case "deletePriceLevel":
                        level = entry.deletePriceLevel;
                        if (level.side === BookSide.BID) {
                            delete bids[level.level];
                        }
                        else if (level.side === BookSide.OFFER) {
                            delete asks[level.level];
                        }
                        break;
                    case "modifyPriceLevel":
                        level = entry.modifyPriceLevel;
                        // Just replace
                        if (level.side === BookSide.BID) {
                            let priceLevel = this._buildPriceLevel(definition, level);
                            bids[level.level] = priceLevel;
                        }
                        else if (level.side === BookSide.OFFER) {
                            let priceLevel = this._buildPriceLevel(definition, level);
                            asks[level.level] = priceLevel;
                        }
                        break;

                }
            });
            Object.keys(bids).forEach((key) => {
                message.bids.push(bids[key]);
            });
            message.bidDepth = message.bids.length;

            Object.keys(asks).forEach((key) => {
                message.asks.push(asks[key]);
            });
            message.askDepth = message.asks.length;

            return message;

        }

        _buildPriceLevel(definition, level) {
            return {
                "price": this._convertPrice(definition, level.price),
                "size": level.quantity,
                "orderCount": level.orderCount,
                "level": level.level
            };
        }

        _getFlag(ddfSymbol) {
            let flag = null;
            let state = this._getState(ddfSymbol);
            switch (state.tradingStatus) {
                case InstrumentTradingStatus.PRE_OPEN:
                    flag = 'p';
                    break;
                case InstrumentTradingStatus.CLOSE:
                case InstrumentTradingStatus.POST_CLOSE:
                    flag = 'c';
                    break;
                // TODO
                // case "Settle":
                //     flag = 's';
                //     break;
            }
            return flag;
        }

        _convertInstrumentStatus(ddfSymbol, instrumentStatus) {
            let state = this._getState(ddfSymbol);
            if (instrumentStatus.tradingStatus) {
                state["tradingStatus"] = instrumentStatus.tradingStatus;
            }
            if (instrumentStatus.tradeDate) {
                state["tradeDate"] = this._convertTradeDate(instrumentStatus.tradeDate);
            }
        }

        _getState(ddfSymbol) {
            let state = this._ddfSymbolToOpenfeedState[ddfSymbol];
            if (!state) {
                state = {};
                this._ddfSymbolToOpenfeedState[ddfSymbol] = state;
            }
            return state;
        }

        _getMode(service) {
            let mode = 'R';
            switch (service) {
                case Service.UNKNOWN_SERVICE:
                    break;
                case Service.REAL_TIME:
                    mode = 'R';
                    break;
                case Service.DELAYED:
                    mode = 'I';
                    break;
                case Service.REAL_TIME_SNAPSHOT:
                    mode = 'R';
                    break;
                case Service.DELAYED_SNAPSHOT:
                    mode = 'I';
                    break;
                case Service.END_OF_DAY:
                    mode = 'D';
                    break;
            }
            return mode;
        }

        _getBook(ddfSymbol) {
            let state = this._getState(ddfSymbol);
            let book = state["book"];
            if (!book) {
                book = {};
                state["book"] = book;
            }
            return book;
        }

        _clearBook(ddfSymbol) {
            let  book = this._getBook(ddfSymbol);
            book = {};
        }

        _getBookSide(ddfSymbol, side) {
            let book = this._getBook(ddfSymbol);
            if (side === BookSide.BID) {
                let bids = book["bids"];
                if (!bids) {
                    bids = {};
                    book["bids"] = bids;
                }
                return bids;
            }
            else if (side === BookSide.OFFER) {
                let offers = book["asks"];
                if (!offers) {
                    offers = {};
                    book["asks"] = offers;
                }
                return offers;
            }
        }

        _handleMarketUpdate(ddfSymbol, definition, ofMessage) {
            let update = ofMessage.marketUpdate;
            let ret = [];
            let message = this._createMessageUpdate(ddfSymbol, definition, update);

            switch (update.data) {
                case "news":
                    log.info("News: ", JSON.stringify(update.news));
                    message = this._createMessage('NEWS');
                    message.headLine = update.news.headLine;
                    message.text = update.news.text;
                    ret.push(message);
                    break;
                case "clearBook":
                    log.info("clearBook: ", JSON.stringify(update.clearBook));
                    message = this._createMessage('CLEARBOOK');
                    this._clearBook(ddfSymbol);
                    ret.push(message);
                    break;
                case "instrumentStatus":
                    log.info("instrumentStatus: ", JSON.stringify(update.instrumentStatus));
                    this._convertInstrumentStatus(update.instrumentStatus);
                    break;
                case "bbo":
                    message.subrecord = '8';
                    message.bidPrice = this._convertPrice(definition, update.bbo.bidPrice);
                    message.bidSize = update.bbo.bidQuantity;
                    message.bidOrderCount = update.bbo.bidOrderCount > 0 ? update.bbo.bidOrderCount : undefined;
                    message.bidOriginator = update.bbo.bidOriginator ? update.bbo.bidOriginator : undefined;
                    message.askPrice = this._convertPrice(definition, update.bbo.offerPrice);
                    message.askSize = update.bbo.offerQuantity;
                    message.askOrderCount = update.bbo.offerOrderCount > 0 ? update.bbo.offerOrderCount : undefined;
                    message.askOriginator = update.bbo.offerOriginator ? update.bbo.offerOriginator : undefined;
                    message.nationalBboUpdated = update.bbo.nationalBboUpdated;
                    message.day = this._getTradingDay(ddfSymbol);
                    
                    message.session = update.bbo.quoteCondition ? update.bbo.quoteCondition : undefined;
                    message.time = this._convertToDate(update.transactionTime);
                    message.type = 'TOB';
                    ret.push(message);
                    break;
                case "depthPriceLevel":
                    log.debug("depthPriceLevel: ", JSON.stringify(update.depthPriceLevel));
                    let depthMessage = this._handleUpdateDepthPriceLevels(ddfSymbol, definition, update.depthPriceLevel);
                    if (depthMessage) {
                        ret.push(depthMessage);
                    }
                    break;
                case "depthOrder":
                    // Not supported in Openfeed yet.
                    log.warn("depthOrder: Not Supported", JSON.stringify(update.depthOrder));
                    message.type = 'BOOK';
                    break;
                case "index":
                    log.info("index: ", JSON.stringify(update.index));
                    break;
                case "trades":
                    // log.info("Trades: ", JSON.stringify(update.trades.trades));
                    update.trades.trades.forEach((entry) => {
                        if (entry.trade) {
                            let message = this._createMessageUpdate(ddfSymbol, definition, update);
                            message.tradePrice = this._convertPrice(definition, entry.trade.price);
                            message.tradeSize = entry.trade.quantity;
                            if (entry.trade.transactionTime) {
                                message.day = this._getTradingDayFromOpenfeedDate(entry.trade.transactionTime);
                            }
                            else {
                                message.day = this._getTradingDay(ddfSymbol);
                            }
                            // Openfeed specific fields
                            message.originatorId = entry.trade.originatorId ? entry.trade.originatorId : undefined;
                            message.tradeId = entry.trade.tradeId ? entry.trade.tradeId : undefined;
                            message.buyerId = entry.trade.buyerId ? entry.trade.buyerId : undefined;
                            message.sellerId = entry.trade.sellerId ? entry.trade.sellerId : undefined;
                            message.side = entry.trade.side ? entry.trade.side : undefined;
                            // TODO not exactly matched, need OF Converter logic?
                            message.session = entry.trade.saleCondition ? entry.trade.saleCondition : ' ';

                            message.type = 'TRADE';
                            ret.push(message);
                        } else if (entry.tradeCorrection) {
                            // TODO
                        } else if (entry.tradeCancel) {
                            // TODO
                        }
                    });
                    // TODO Z trade, need Jerq changes
                    //message.type = 'TRADE_OUT_OF_SEQUENCE'; TODO
                    break;
                case "open":
                    // log.info("open: ", JSON.stringify(update.open));
                    message.subrecord = '0';
                    message.type = 'OPEN';
                    message.value = this._convertPrice(definition, update.open.price);
                    message.element = 'A';
                    message.modifier = '';
                    ret.push(message);
                    break;
                case "high":
                    // log.info("high: ", JSON.stringify(update.high));
                    message.subrecord = '0';
                    message.value = this._convertPrice(definition, update.high.price);
                    message.element = '5';
                    message.modifier = '';
                    message.type = 'HIGH';
                    ret.push(message);
                    break;
                case "low":
                    // log.info("low: ", JSON.stringify(update.low));
                    message.subrecord = '0';
                    message.value = this._convertPrice(definition, update.low.price);
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
                    // log.info("last: ", JSON.stringify(update.last));
                    break;
                case "yearHigh":
                    log.info("yearHigh: ", JSON.stringify(update.yearHigh));
                    break;
                case "yearLow":
                    log.info("yearLow: ", JSON.stringify(update.yearLow));
                    break;
                case "volume":
                    // log.info("volume: ", JSON.stringify(update.volume));
                    message.subrecord = '0';
                    message.value = this._convertPrice(definition, update.volume.volume);
                    message.element = '7';
                    message.modifier = '6';
                    message.type = 'VOLUME';
                    ret.push(message);
                    // TODO
                    // message.type ='VOLUME_YESTERDAY';
                    // TODO Cumulative volume
                    break;
                case "settlement":
                    log.info("settlement: ", JSON.stringify(update.settlement));
                    message.subrecord = '0';
                    message.value = this._convertPrice(definition, update.settlement.price);
                    // Flag
                    if (update.settlement.preliminarySettle && update.settlement.preliminarySettle === true) {
                        message.element = 'd';
                        // type is not set so MarketState will not process
                    }
                    else {
                        message.element = 'D';
                        message.modifier = '0';
                        message.type = 'SETTLEMENT';
                    }
                    ret.push(message);
                    break;
                case "openInterest":
                    log.info("openInterest: ", JSON.stringify(update.openInterest));
                    message.subrecord = '0';
                    message.value = this._convertPrice(definition, update.openInterest.volume);
                    message.element = 'C';
                    message.modifier = '';
                    message.type = 'OPEN_INTEREST';
                    ret.push(message);
                    break;
                case "vwap":
                    log.info("vwap: ", JSON.stringify(update.vwap));
                    message.subrecord = '0';
                    message.value = this._convertPrice(definition, update.vwap.vwap);
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

    return OpenfeedConverter;
})();
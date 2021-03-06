const axios = require('axios');

const array = require('@barchart/common-js/lang/array'),
	is = require('@barchart/common-js/lang/is');

const convertDateToDayCode = require('../../../utilities/convert/dateToDayCode'),
	convertDayCodeToNumber = require('../../../utilities/convert/dayCodeToNumber'),
	convertBaseCodeToUnitCode = require('../../../utilities/convert/baseCodeToUnitCode');

module.exports = (() => {
	'use strict';

	const regex = { };

	regex.day = /^([0-9]{4}).?([0-9]{2}).?([0-9]{2})$/;

	regex.cmdty = { };
	regex.cmdty.short = /^(BC|BE|BL|CA|EI|EU|CF|CB|UD)(.*)(\.CS)$/i;
	regex.cmdty.long = /^(BCSD-|BEA-|BLS-|CANS-|EIA-|EURS-|CFTC-|USCB-|USDA-)/i;
	regex.cmdty.alias = /^(BC|BE|BL|CA|EI|EU|CF|CB|UD|BCSD-|BEA-|BLS-|CANS-|EIA-|EURS-|CFTC-|USCB-|USDA-)(.*)(\.CM)$/i;

	regex.c3 = { };
	regex.c3.symbol = /(\.C3)$/i;
	regex.c3.alias = /^(C3:)(.*)$/i;

	regex.c3.currencies = { };
	regex.c3.currencies.eur = /^(EUR)\/(.*)$/i;
	regex.c3.currencies.rub = /^(RUB)\/(.*)$/i;
	regex.c3.currencies.uah = /^(UAH)\/(.*)$/i;
	regex.c3.currencies.usd = /^(USD|Usc|\$|)\/(.*)$/i;

	/**
	 * Executes an HTTP request for a quote snapshot(s) and returns a
	 * promise of quote refresh message(s) (suitable for processing by
	 * the {@link MarketState#processMessage} function).
	 *
	 * @function
	 * @param {String|Array<String>} symbols
	 * @param {String} username
	 * @param {String} password
	 * @returns {Promise<Array>}
	 */
	function retrieveSnapshots(symbols, username, password) {
		return Promise.resolve()
			.then(() => {
				let symbolsToUse;

				if (is.string(symbols)) {
					symbolsToUse = [ symbols ];
				} else if (Array.isArray(symbols)) {
					symbolsToUse = symbols;
				} else {
					throw new Error('The "symbols" argument must be a string or an array of strings.');
				}

				if (symbolsToUse.some(s => !is.string(s))) {
					throw new Error('The "symbols" can only contain strings.');
				}

				if (!is.string(username)) {
					throw new Error('The "username" argument must be a string.');
				}

				if (!is.string(password)) {
					throw new Error('The "password" argument must be a string.');
				}

				const aliases = { };

				const getCmdtySymbols = [ ];
				const getQuoteSymbols = [ ];

				symbolsToUse.forEach((symbol) => {
					const concrete = getConcreteSymbol(symbol);

					if (concrete !== symbol) {
						aliases[concrete] = symbol;
					}

					if (regex.cmdty.long.test(concrete) || regex.cmdty.short.test(concrete)) {
						getCmdtySymbols.push(concrete);
					} else {
						getQuoteSymbols.push(concrete);
					}
				});

				const promises = [ ];

				if (getCmdtySymbols.length !== 0) {
					promises.push(retrieveSnapshotsUsingGetCmdtyStats(getCmdtySymbols, username, password));
				}


				if (getQuoteSymbols.length !== 0) {
					promises.push(retrieveSnapshotsUsingGetQuote(getQuoteSymbols, username, password));
				}

				if (promises.length === 0) {
					return Promise.resolve([ ]);
				}

				return Promise.all(promises)
					.then((results) => {
						const quotes = array.flatten(results, true);

						quotes.forEach((quote) => {
							const concrete = quote.symbol;

							if (aliases.hasOwnProperty(concrete)) {
								quote.symbol = aliases[concrete];
							}
						});

						return quotes;
					});
			});
	}

	const ADDITIONAL_FIELDS = [
		'exchange',
		'bid',
		'bidSize',
		'ask',
		'askSize',
		'tradeSize',
		'numTrades',
		'settlement',
		'previousLastPrice'
	];

	function retrieveSnapshotsUsingGetQuote(symbols, username, password) {
		return Promise.resolve()
			.then(() => {
				const options = {
					url: `https://webapp-proxy.aws.barchart.com/v1/proxies/ondemand/getQuote.json?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&symbols=${encodeURIComponent(symbols.join())}&fields=${encodeURIComponent(ADDITIONAL_FIELDS.join())}`,
					method: 'GET'
				};

				return Promise.resolve(axios(options))
					.then((response) => {
						const results = response.data.results || [ ];

						const messages = results.map((result) => {
							const message = { };

							message.type = 'REFRESH_QUOTE';

							message.symbol = result.symbol.toUpperCase();
							message.name = result.name;
							message.exchange = result.exchange;

							if (result.unitCode !== null) {
								message.unitcode = convertBaseCodeToUnitCode(parseInt(result.unitCode));
							} else {
								message.unitcode = '2';
							}

							message.tradeTime = new Date(result.tradeTimestamp);

							let dayCode;

							if (is.string(result.dayCode) && result.dayCode.length === 1) {
								dayCode = result.dayCode;
							} else {
								dayCode = convertDateToDayCode(message.tradeTime);
							}

							message.day = dayCode;
							message.dayNum = convertDayCodeToNumber(dayCode);
							message.flag = result.flag;
							message.mode = result.mode;

							message.lastPrice = result.lastPrice;
							message.tradeSize = result.tradeSize;
							message.numberOfTrades = result.numTrades;

							message.bidPrice = result.bid;
							message.bidSize = result.bidSize;
							message.askPrice = result.ask;
							message.askSize = result.askSize;

							message.settlementPrice = result.settlement;
							message.previousPrice = result.previousLastPrice;

							message.openPrice = result.open;
							message.highPrice = result.high;
							message.lowPrice = result.low;

							message.volume = result.volume;

							message.lastUpdate = message.tradeTime;

							if (regex.c3.symbol.test(message.symbol)) {
								const c3 = { };

								c3.currency = null;
								c3.delivery = null;

								if (result.commodityDataCurrency) {
									c3.currency = getC3Currency(result.commodityDataCurrency);
								}

								if (result.commodityDataDelivery) {
									c3.delivery = result.commodityDataDelivery;
								}

								message.additional = { c3: c3 };
							}

							return message;
						});

						return messages;
					});
			});
	}

	function retrieveSnapshotsUsingGetCmdtyStats(symbols, username, password) {
		return Promise.resolve()
			.then(() => {
				const options = {
					url: `https://webapp-proxy.aws.barchart.com/v1/proxies/ondemand/getCmdtyQuotes.json?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&symbols=${encodeURIComponent(symbols.join(','))}`,
					method: 'GET'
				};

				return Promise.resolve(axios(options))
					.then((response) => {
						const results = response.data.results || [ ];

						const messages = symbols.reduce((accumulator, symbol) => {
							const result = results.find(result => result.symbol === symbol || result.shortSymbol === symbol);

							if (!result) {
								return accumulator;
							}

							const match = result.tradeTimestamp.match(regex.day);
							const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
							const dayCode = convertDateToDayCode(date);

							const message = { };

							message.type = 'REFRESH_QUOTE';

							if (regex.cmdty.long.test(symbol)) {
								message.symbol = result.symbol.toUpperCase();
							} else {
								message.symbol = result.shortSymbol.toUpperCase();
							}

							message.name = result.shortName;
							message.exchange = 'CSTATS';
							message.unitcode = '2';

							message.day = dayCode;
							message.dayNum = convertDayCodeToNumber(dayCode);

							message.lastPrice = result.lastPrice;

							if (result.previousClose) {
								message.previousPrice = result.previousClose;
							}

							message.lastUpdate = date;

							accumulator.push(message);

							return accumulator;
						}, [ ]);

						return messages;
					});
			});
	}

	function getC3Currency(lotSizeFix) {
		if (regex.c3.currencies.eur.test(lotSizeFix)) {
			return 'EUR';
		} else if (regex.c3.currencies.rub.test(lotSizeFix)) {
			return 'RUB';
		} else if (regex.c3.currencies.uah.test(lotSizeFix)) {
			return 'UAH';
		} else if (regex.c3.currencies.usd.test(lotSizeFix)) {
			return 'USD';
		} else {
			return null;
		}
	}

	function getConcreteSymbol(symbol) {
		if (regex.cmdty.alias.test(symbol)) {
			return symbol.replace(regex.cmdty.alias, '$1$2.CS');
		} else if (regex.c3.alias.test(symbol)) {
			return symbol.replace(regex.c3.alias, '$2.C3');
		} else {
			return symbol;
		}
	}

	return retrieveSnapshots;
})();

const process = require('process');
const fs = require('fs');
const version = require('./../../lib/meta').version;
const Connection = require('./../../lib/connection/Connection'),
	SubscriptionType = require('./../../lib/connection/SubscriptionType'),
	WebSocketAdapterFactoryForNode = require('./../../lib/connection/adapter/WebSocketAdapterFactoryForNode');
const CustomLoggingProvider = require('./logging/CustomLoggingProvider');
const LoggerFactory = require('./../../lib/logging/LoggerFactory');

function getMsTimeRepr(dateObject, dateStr) {
	var ms = dateObject.getMilliseconds();
	var splitted = dateStr.split(' ');
	splitted[0] = splitted[0] + '.' + ms;
	return splitted.join(' ');
}

const startup = (() => {
	'use strict';
	//LoggerFactory.configureForConsole();
	//LoggerFactory.configureForSilence();
	LoggerFactory.configure(new CustomLoggingProvider());
	const __logger = LoggerFactory.getLogger('@barchart/example');
	__logger.log(`Node.js example script started [ version ${version} ]`);
	let connection = null;
	let adapterFactory = null;
	process.on('SIGINT', () => {
		__logger.log('\nProcessing SIGINT');
		if (connection !== null) {
			connection.disconnect();
		}
		__logger.log('Node.js example script ending');
		__logger.log('Closing file handler');
		stream.end();
		process.exit();
	});
	process.on('unhandledRejection', (error) => {
		__logger.error('Unhandled Promise Rejection');
		__logger.trace();
	});
	process.on('uncaughtException', (error) => {
		__logger.error('Unhandled Error', error);
		__logger.trace();
	});
	const host = process.argv[2];
	const username = process.argv[3];
	const password = process.argv[4];
	const symbols = process.argv[5];
	__logger.log(`Instantiating Connection (using Node.js adapter) for [ ${username}/${password} ] @ [ ${host} ]`);
	__logger.log('Writing ticker to quote_log.txt');
	__logger.log('Ticker format: local_time,market_time,symbol,local_bc_symbol,exchange,broker,ticker_type,bid,bid_size,ask,ask_size,last,last_size');
	var stream = fs.createWriteStream("quote_log.txt", {flags:'a'});
	connection = new Connection();
	adapterFactory = new WebSocketAdapterFactoryForNode();
	connection.connect(host, username, password, adapterFactory);
	var dateOptions = {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeStyle: 'long', timeZoneName: 'short'};
	if (typeof symbols === 'string') {
		symbols.split(',').forEach((s) => {
			let price = null;
			const handleMarketUpdate = function(message) {
				const q = connection.getMarketState().getQuote(s);
				const current = q.lastPrice;
				if (price !== current) {
					price = current;
					//__logger.log(`${s} = ${price}`);
					//__logger.log(quote);
					dateOptions.timeZone = q.profile.exchangeRef.timezoneExchange;
					var marketTimeStr = q.lastUpdate.toLocaleString("en-US", dateOptions);
					marketTimeStr = getMsTimeRepr(q.lastUpdate, marketTimeStr);
					delete dateOptions.timeZone;
					var localTime = new Date();
					var localTimeStr = localTime.toLocaleString("en-US", dateOptions);
					localTimeStr = getMsTimeRepr(localTime, localTimeStr);
					stream.write(`${localTimeStr},${marketTimeStr},${q.profile.root},${s},${q.profile.exchange},barchart,live,${q.bidPrice},${q.bidSize},${q.askPrice},${q.askSize},${q.lastPrice},${q.tradeSize}\n`);
				}
			};
			connection.on(SubscriptionType.MarketUpdate, handleMarketUpdate, s);
		});
	}
})();

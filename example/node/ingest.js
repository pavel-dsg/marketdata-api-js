const process = require('process');
const fs = require('fs');
const version = require('./../../lib/meta').version;
const Connection = require('./../../lib/connection/Connection'),
	SubscriptionType = require('./../../lib/connection/SubscriptionType'),
	WebSocketAdapterFactoryForNode = require('./../../lib/connection/adapter/WebSocketAdapterFactoryForNode');
const CustomLoggingProvider = require('./logging/CustomLoggingProvider');
const LoggerFactory = require('./../../lib/logging/LoggerFactory');
const startup = (() => {
	'use strict';
	//LoggerFactory.configureForConsole();
	//LoggerFactory.configureForSilence();
	LoggerFactory.configure(new CustomLoggingProvider());
	const __logger = LoggerFactory.getLogger('@barchart/example');
	__logger.log(`Example: Node.js example script started [ version ${version} ]`);
	let connection = null;
	let adapterFactory = null;
	process.on('SIGINT', () => {
		__logger.log('\nExample: Processing SIGINT');
		if (connection !== null) {
			connection.disconnect();
		}
		__logger.log('Example: Node.js example script ending');
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
	__logger.log(`Example: Instantiating Connection (using Node.js adapter) for [ ${username}/${password} ] @ [ ${host} ]`);
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
					var marketTime = q.lastUpdate.toLocaleString("en-US", dateOptions);
					var marketTimeMs = q.lastUpdate.getMilliseconds();
					var splitted = marketTime.split(' ');
					splitted[0] = splitted[0] + '.' + marketTimeMs;
					marketTime = splitted.join(' ');
					delete dateOptions.timeZone;
					var localTime = new Date().toLocaleString("en-US", dateOptions);
					stream.write(`${localTime},${marketTime},${q.profile.root},${s},${q.profile.exchange},barchart,live,${q.bidPrice},${q.bidSize},${q.askPrice},${q.askSize},${q.lastPrice},${q.tradeSize}\n`);
				}
			};
			connection.on(SubscriptionType.MarketUpdate, handleMarketUpdate, s);
		});
	}
})();

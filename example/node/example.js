const process = require('process');

const version = require('./../../lib/index').version;

const Connection = require('./../../lib/connection/websocket/Connection'),
	SubscriptionType = require('./../../lib/connection/SubscriptionType'),
	WebSocketAdapterFactoryForNode = require('./../../lib/connection/websocket/adapter/WebSocketAdapterFactoryForNode');

const CustomLoggingProvider = require('./logging/CustomLoggingProvider');

const LoggerFactory = require('./../../lib/logging/LoggerFactory');

const ClientConfig = require('./../../lib/common/ClientConfig').ClientConfig,
	Protocol = require('./../../lib/common/ClientConfig').Protocol;

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

		process.exit();
	});

	const host = process.argv[2];
	const username = process.argv[3];
	const password = process.argv[4];
	const symbols = process.argv[5];

	__logger.log(`Example: Instantiating Connection (using Node.js adapter) for [ ${username}/${password} ] @ [ ${host} ]`);

	var useOpenfeed = true;
	var config = new ClientConfig();
	if(useOpenfeed) {
		config.url = "ws://openfeed.aws.barchart.com:9001/ws";
		config.protocol = Protocol.OPENFEED;
		// Configurable protobuf path
		// config.protoPath = "xxxx";
	}

	connection = new Connection(config);
	adapterFactory = new WebSocketAdapterFactoryForNode(config);

	connection.connect(host, username, password, adapterFactory);

	// Handlers
	connection.on(SubscriptionType.Timestamp, (message) => {
		__logger.log('TS: ' + JSON.stringify(message));
	});
	connection.on(SubscriptionType.Events, (message) => {
		__logger.log('Event: ' + JSON.stringify(message));
	});

	if (typeof symbols === 'string') {
		symbols.split(',').forEach((s) => {
			let price = null;

			const handleMarketUpdate = (message) => {
				switch (message.type) {
					case "TOB":
						__logger.log("< " + message.type +" "+ JSON.stringify(message));
						break;
					case "TRADE":
						__logger.log("< " + message.type +" "+ JSON.stringify(message));
						break;
				}
				let q = connection.getMarketState().getQuote(s);
				const current = connection.getMarketState().getQuote(s).lastPrice;
				if (price !== current) {
					price = current;
					__logger.log(`Example: ${s} = ${price}`);
				}
			};

			const handleMarketDepth = (message) => {
				__logger.log("< " + message.type + " " + JSON.stringify(message));
			};

			connection.on(SubscriptionType.MarketUpdate, handleMarketUpdate, s);
			// connection.on(SubscriptionType.MarketDepth, handleMarketDepth, s);
		});
	}
})();

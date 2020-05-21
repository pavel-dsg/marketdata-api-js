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
    stream.write(']\n');
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
  __logger.log('Writing ticker to quote_log.json');
  var stream = fs.createWriteStream("quote_log.json", {
    flags: 'a'
  });
  stream.write('[\n');
  connection = new Connection();
  adapterFactory = new WebSocketAdapterFactoryForNode();
  connection.connect(host, username, password, adapterFactory);
  var dateOptions = {
    dateStyle: 'short',
    timeStyle: 'long',
    hour12: false
  };
  if (typeof symbols === 'string') {
    symbols.split(',').forEach((s) => {
      const handleMarketUpdate = function(message) {
        const q = connection.getMarketState().getQuote(s);
          stream.write(JSON.stringify(q) + ',\n');
      };
      connection.on(SubscriptionType.MarketUpdate, handleMarketUpdate, s);
    });
  }
})();

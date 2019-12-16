const process = require('process');
const fs = require('fs');
const version = require('./../../lib/meta').version;
const Connection = require('./../../lib/connection/Connection'),
  SubscriptionType = require('./../../lib/connection/SubscriptionType'),
  WebSocketAdapterFactoryForNode = require('./../../lib/connection/adapter/WebSocketAdapterFactoryForNode');
const CustomLoggingProvider = require('./logging/CustomLoggingProvider');
const LoggerFactory = require('./../../lib/logging/LoggerFactory');

function getLocalizedTimestr(dateObject, options) {
  var ms = dateObject.getMilliseconds();
  var localized = dateObject.toLocaleString("en-US", options).replace(', ', 'T');
  var splitted = localized.split(' ');
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
  __logger.log('Writing ticker to quote_log.csv');
  __logger.log('Ticker format: local_time,last_update_time,time,trade_time,time_stamp,symbol,local_bc_symbol,exchange,broker,ticker_type,bid,bid_size,ask,ask_size,last,last_size');
  var stream = fs.createWriteStream("quote_log.csv", {
    flags: 'a'
  });
  stream.write('local_time,last_update_time,time,trade_time,time_stamp,symbol,local_bc_symbol,exchange,broker,ticker_type,bid,bid_size,ask,ask_size,last,last_size\n');
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
      let price = null;
      const handleMarketUpdate = function(message) {
        const q = connection.getMarketState().getQuote(s);
        const current = q.lastPrice;
        if (price !== current) {
          price = current;
          dateOptions.timeZone = q.profile.exchangeRef.timezoneExchange;
          var lastUpdateStr = getLocalizedTimestr(q.lastUpdate, dateOptions);
          var timeStr = getLocalizedTimestr(q.time, dateOptions);
          var tradeTimeStr = getLocalizedTimestr(q.message.tradeTime, dateOptions);
          var timeStampStr = getLocalizedTimestr(q.message.timeStamp, dateOptions);
          delete dateOptions.timeZone;
          var localTime = new Date();
          var localTimeStr = getLocalizedTimestr(localTime, dateOptions);
          stream.write(`${localTimeStr},${lastUpdateStr},${timeStr},${tradeTimeStr},${timeStampStr},${q.profile.root},${s},${q.profile.exchange},barchart,live,${q.bidPrice},${q.bidSize},${q.askPrice},${q.askSize},${q.lastPrice},${q.tradeSize}\n`);
        }
      };
      connection.on(SubscriptionType.MarketUpdate, handleMarketUpdate, s);
    });
  }
})();

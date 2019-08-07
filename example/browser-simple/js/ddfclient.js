
const version = require('./../../../lib/index').version;

const Connection = require('./../../../lib/connection/websocket/Connection'),
	symbolResolver = require('./../../../lib/util/symbolResolver');


var username = "dlucek";
var password = "barchart";
var server = "qsws-us-e-01.aws.barchart.com";
var connection = null;
var symbols = "ESU9,YMU9,NQU9,ZCU9,ZCZ9,ZCH0,ZCK0,ZCN0,ZSQ9,ZSU9,ZSX9,ZSF0,ZSH0,ZMQ9,ZMU9,ZMV9,ZLQ9,ZLU9,ZLV9,ZWU9,ZWZ9,ZWH0,ZOU9,ZOZ9,ZOH0,ZRU9,ZRX9,KEU9,KEZ9,KEH0,MWH0,MWH0,MWZ9,RSX9,RSF0,YMU9,YMZ9,YMH0,YMM0,YMU2535C,YMU2535P,YMU2540C,YMU2540P,YMU2545C,YMU2545P,YMU2550C,YMU2550P,YMU2555C,YMU2555P,YMU2560C,YMU2560P,YMU2565C,YMU2565P,YMU2570C,YMU2570P,YMU2575C,YMU2575P,YMU2580C,YMU2580P,YMU2585C,YMU2585P,YMU2590C,YMU2590P".split(",");
var exchange = "CRYPTO";

var numQuotes = 0;
var numKA = 0;
var onMarketUpdate = function (message) {
	var q = connection.getMarketState().getQuote(message.symbol);
	numQuotes++;
	if (q) {
		if ((numQuotes % 1000) == 0) {
			console.log('NumQuotes: ' + numQuotes + ' Symbol: ' + q.symbol + ' Last:' + q.lastPrice + " Bid: " + q.bidPrice + " Ask:" + q.askPrice);
		}
	}
};
var onTimestamp = function (date) {
	numKA++;
	if ((numKA % 100) == 0)
		console.log(date);
};


$(document).ready(function () {
	console.log("Starting DDF Client ");

	connection = new Connection();


	// Setup handlers
	connection.on('events', function (info) {
		// Basic Network Events
		console.log("EVT: " + info);
	});
	connection.on('timestamp', onTimestamp);
	console.log("Subscribing to: "+symbols.length + " symbols");
	symbols.forEach((sym) => {
		connection.on('marketUpdate', onMarketUpdate, sym);
	});

	console.log("Connecting to: " + server);
	connection.connect(server, username, password);

});




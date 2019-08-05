
const version = require('./../../../lib/index').version;

const Connection = require('./../../../lib/connection/websocket/Connection'),
	symbolResolver = require('./../../../lib/util/symbolResolver');


var username = "dlucek";
var password = "barchart";
var server = "qsws-us-e-01.aws.barchart.com";
var connection = null;

var numQuotes = 0;
var numKA = 0;
var onMarketUpdate = function(message) {
	var q = connection.getMarketState().getQuote(message.symbol);
	numQuotes++;
	if (q) {
		if((numQuotes % 20) == 0) {
			console.log('NumQuotes: ' + numQuotes +  ' Symbol: ' + q.symbol + ' Last:' + q.lastPrice + " Bid: " +q.bidPrice + " Ask:"+q.askPrice);
		}
	}
};
var onTimestamp = function(date) {
	numKA++;
	if((numKA % 20) == 0) 
	console.log(date);
};


$(document).ready(function() {
	console.log("Starting DDF Client ");

	connection = new Connection();
	

	// Setup handlers
	connection.on('events', function(info) {
		// Basic Network Events
		console.log("EVT: "+info);
	});
	connection.on('marketUpdate', onMarketUpdate, 'ESZ9');
	connection.on('timestamp', onTimestamp);

	console.log("Connecting to: "+server);
	connection.connect(server, username, password);

});




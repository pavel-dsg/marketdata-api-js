module.exports = (() => {
    'use strict';

    const Result = {
        UNKNOWN_RESULT : 0,
        SUCCESS  :  1 ,
        INVALID_SYMBOL  :  116 ,
        INVALID_MARKET_ID  :  117 ,
        INVALID_EXCHANGE  :  118 ,
        INVALID_CHANNEL_ID  :  119 ,
        MALFORMED_MESSAGE  :  120 ,
        UNEXPECTED_MESSAGE  :  121 ,
        NOT_SUBSCRIBED  :  122 ,
        DUPLICATE_SUBSCRIPTION  :  123 ,
        INVALID_CREDENTIALS  :  124 ,
        INSUFFICIENT_PRIVILEGES  :  125 ,    
        AUTHENTICATION_REQUIRED  :  126 ,    
        GENERIC_FAILURE  :  127 
      };

      const Service = {
        UNKNOWN_SERVICE : 0,
        REAL_TIME : 1,
        DELAYED : 2,
        REAL_TIME_SNAPSHOT : 3,
        DELAYED_SNAPSHOT : 4
      };

      const TradingDay =  {
          1 : '1',
          2 : '2',
          3 : '3',
          4 : '4',
          5 : '5',
          6 : '6',
          7 : '7',
          8 : '8',
          9 : '9',
          10 : '0',
          11 : 'A',
          12 : 'B',
          13 : 'C',
          14 : 'D',
          15 : 'E',
          16 : 'F',
          17 : 'G',
          18 : 'H',
          19 : 'I',
          20 : 'J',
          21 : 'K',
          22 : 'L',
          23 : 'M',
          24 : 'N',
          25 : 'O',
          26 : 'P',
          27 : 'Q',
          28 : 'R',
          29 : 'S',
          30 : 'T',
          31 : 'U'
      };

	return {
        Result : Result,
        Service : Service,
        TradingDay : TradingDay
    }
})();

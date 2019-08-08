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

      
	return {
        Result : Result,
        Service : Service
    }
})();

module.exports = (() => {
  'use strict';

  const Result = {
    UNKNOWN_RESULT: 0,
    SUCCESS: 1,
    INVALID_SYMBOL: 116,
    INVALID_MARKET_ID: 117,
    INVALID_EXCHANGE: 118,
    INVALID_CHANNEL_ID: 119,
    MALFORMED_MESSAGE: 120,
    UNEXPECTED_MESSAGE: 121,
    NOT_SUBSCRIBED: 122,
    DUPLICATE_SUBSCRIPTION: 123,
    INVALID_CREDENTIALS: 124,
    INSUFFICIENT_PRIVILEGES: 125,
    AUTHENTICATION_REQUIRED: 126,
    GENERIC_FAILURE: 127
  };

  const Service = {
    UNKNOWN_SERVICE: 0,
    REAL_TIME: 1,
    DELAYED: 2,
    REAL_TIME_SNAPSHOT: 3,
    DELAYED_SNAPSHOT: 4,
    END_OF_DAY: 5
  };

  const SubscriptionType = {
    ALL: 0,
    QUOTE: 1,
    DEPTH_PRICE: 2,
    DEPTH_ORDER: 3,
    TRADES: 4,
    CUMLATIVE_VOLUME: 5,
    OHLC: 6
  };

  const TradingDay = {
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: '0',
    11: 'A',
    12: 'B',
    13: 'C',
    14: 'D',
    15: 'E',
    16: 'F',
    17: 'G',
    18: 'H',
    19: 'I',
    20: 'J',
    21: 'K',
    22: 'L',
    23: 'M',
    24: 'N',
    25: 'O',
    26: 'P',
    27: 'Q',
    28: 'R',
    29: 'S',
    30: 'T',
    31: 'U'
  };

  /// Book side
  const BookSide = {
    UNKNOWN_BOOK_SIDE: 0,
    BID: 1,
    OFFER: 2
  };

  const InstrumentTradingStatus = {
    UNKNOWN_TRADING_STATUS: 0,
    TRADING_RESUME: 1,
    PRE_OPEN: 2,
    OPEN: 3,
    PRE_CLOSE: 4,
    CLOSE: 5,
    TRADING_HALT: 6,
    QUOTATION_RESUME: 7,
    OPEN_DELAY: 8,
    NO_OPEN_NO_RESUME: 9,
    FAST_MARKET: 10,
    FAST_MARKET_END: 11,
    LATE_MARKET: 12,
    LATE_MARKET_END: 13,
    POST_SESSION: 14,
    POST_SESSION_END: 15,
    NEW_PRICE_INDICATION: 16,
    NOT_AVAILABLE_FOR_TRADING: 17,
    PRE_CROSS: 18,
    CROSS: 19,
    POST_CLOSE: 20,
    NO_CHANGE: 21,
    // Not available for trading.
    NAFT: 22
  };

  return {
    Result: Result,
    Service: Service,
    SubscriptionType: SubscriptionType,
    TradingDay: TradingDay,
    BookSide: BookSide,
    Service: Service,
    InstrumentTradingStatus: InstrumentTradingStatus
  }
})();

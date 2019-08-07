module.exports = (() => {
    'use strict';

    /**
     */
    class ClientConfig {
        constructor() {
        }

        get url() {
            return this._url;
        }
        set url(v) {
            this._url = v;
        }

        get protocol() {
            return this._protocol;
        }
        set protocol(v) {
            this._protocol = v;
        }

        isOpenfeed() {
            if(this._protocol && this._protocol === "openfeed") {
                return true;
            }
            return false;
        }
        
        toString() {
            return "Config: url "+ this._url + " prot: "+this._protocol;
        }
    }

    return ClientConfig;
})();

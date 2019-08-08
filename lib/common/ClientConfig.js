module.exports = (() => {
    'use strict';

    const Protocol = {
        DDF: 1,
        OPENFEED: 2
    };

    /**
     */
    class ClientConfig {
        constructor() {
            this._protocol = Protocol.DDF;
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
            if (this._protocol === Protocol.OPENFEED) {
                return true;
            }
            return false;
        }

        toString() {
            return "Config: url " + this._url + " prot: " + this._protocol;
        }
    }

    return {
        Protocol: Protocol,
        ClientConfig: ClientConfig
    }
})();

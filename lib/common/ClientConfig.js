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
            this._protoPath = null;
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

        get protoPath() {
            return this._protoPath;
        }
        set protoPath(v) {
            this._protoPath = v;
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

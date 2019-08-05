
module.exports = (() => {
    'use strict';

    /**
     * Decode and processing stats.
     */
    class Stats {
        constructor() {
            if (window) {
                this._perf = window.performance;
            }
            this._numPackets = 0;
            this._totalFrameConvertMs = 0;
            this._numMessages = 0;
            this._totalMessageParseMs = 0;
            this._totalMessageBytes = 0;
            //
            this._numBbo = 0;
            this._totalBytesBbo = 0;
            this._totalDecodeTimeMsBbo = 0;
        }
        ts() {
            if (window) {
                return this._perf.now();
            }
            return 0;
        }
        logPacket(startMs) {
            this._numPackets++;
            let durationMs = this.ts() - startMs;
            this._totalFrameConvertMs += durationMs;
        }
        messageBytes(noBytes) {
            this._totalMessageBytes += noBytes;
        }

        frameTimeMs(startMs) {
            let durationMs = this.ts() - startMs;
            this._totalFrameConvertMs += durationMs;
        }
        messageParseMs(startMs) {
            this._numMessages++;
            let durationMs = this.ts() - startMs;
            this._totalMessageParseMs += durationMs;
        }
        parseBbo(startMs,noBytes) {
            this._numBbo++;
            let durationMs = this.ts() - startMs;
            this._totalDecodeTimeMsBbo += durationMs;
            this._totalBytesBbo += noBytes;
        }

        getAveBytesPerMessage() {
            return this._totalMessageBytes/this._numMessages;
        }
        getAveMessageDecodeTime() {
            return this._totalMessageParseMs/this._numMessages;
        }

        toString() {
            return "numPkt: "+this._numPackets + " numMsg: " + this._numMessages + " aveMsgSize: " + this.getAveBytesPerMessage() + " aveMessageDecodeMs: "+ this.getAveMessageDecodeTime() +
            " noBbo: "+this._numBbo + " aveBboLen: "+ (this._totalBytesBbo/this._numBbo) + " aveDecodeBboMs: "+ (this._totalDecodeTimeMsBbo/this._numBbo);
        }
    }
    return Stats;
})();

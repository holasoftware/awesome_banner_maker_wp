(function(global){
    var isarray = Array.isArray || function (arr) {
      return {}.toString.call(arr) == '[object Array]';
    };

    function has (obj, key) { return Object.prototype.hasOwnProperty.call(obj,key) }


    function RPC(target, methods) {
        if (!(this instanceof RPC)) return new RPC(target, methods);
        var self = this;
        this.target = target;


        this._sequence = 0;
        this._callbacks = {};
        
        this._onmessage = function (ev) {
            if (self._destroyed) return;
            if (!ev.data || typeof ev.data !== 'object') return;
            if (ev.data.protocol !== 'frame-rpc') return;
            if (!isarray(ev.data.arguments)) return;
            self._handle(ev.data);
        };
        this.target.addEventListener('message', this._onmessage);
        this._methods = (typeof methods === 'function'
            ? methods(this)
            : methods
        ) || {};
    }

    RPC.prototype.destroy = function () {
        this._destroyed = true;
        this.target.removeEventListener('message', this._onmessage);
    };

    RPC.prototype.call = function (method) {
        var args = [].slice.call(arguments, 1);
        return this.apply(method, args);
    };

    RPC.prototype.apply = function (method, args) {
        console.log("RPC", method, args);

        if (this._destroyed) return;
        var seq = this._sequence ++;
        if (typeof args[args.length - 1] === 'function') {
            this._callbacks[seq] = args[args.length - 1];
            args = args.slice(0, -1);
        }
        this._sendMessage({
            sequence: seq,
            method: method, 
            arguments: args
        });
    };

    RPC.prototype._sendMessage = function (msg) {
        msg.protocol = 'frame-rpc';

        this.target.postMessage(msg, "*");
    };

    RPC.prototype._handle = function (msg) {
        var self = this;
        if (self._destroyed) return;
        if (has(msg, 'method')) {
            if (!has(this._methods, msg.method)) return;
            var args = msg.arguments.concat(function () {
                self._sendMessage({
                    response: msg.sequence,
                    arguments: [].slice.call(arguments)
                });
            });
            this._methods[msg.method].apply(this._methods, args);
        }
        else if (has(msg, 'response')) {
            var cb = this._callbacks[msg.response];
            delete this._callbacks[msg.response];
            if (cb) cb.apply(null, msg.arguments);
        }
    };

    global.RPC = RPC;
})(this);

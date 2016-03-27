var msgpack = require('msgpack-lite');

var Webmo = function Webmo(host) {
  host = host || "webmo.local";

  this.host = host;
  this.stepDegree = 1.8;
  this.onmessage = null;
  this._ws = new WebSocket("ws://" + host + ":8080/");
  this._ws.binaryType = 'arraybuffer';
  this._ws.onopen = null;

  var that = this;
  this._ws.onmessage = function(e) {
    var json = msgpack.decode(new Uint8Array(e.data));

    if(that.onmessage !== null) {
      that.onmessage(json);
    }
  };
  this._ws.onclose = function(e) {
    console.log('close', e);
  };
  this._ws.onerror = function(e) {
    console.log('error', e);
  };
};

Webmo.prototype.getStatus = function getStatus() {
  var packed = msgpack.encode({type: 'status'});
  this._ws.send(packed);
};

//
// rotate
//
Webmo.prototype.rotate = function rotate(speed, option) {
  if(typeof speed == "object") {
    option = speed;
    speed = undefined;
  }

  var packed = msgpack.encode({type: 'rotate', speed: speed});
  this._ws.send(packed);
};

Webmo.prototype.rotateTo = function rotateTo(target, absRange, speed) {
  var packed = msgpack.encode({type: 'rotateTo', target: target, absRange: absRange, speed: speed});
  this._ws.send(packed);
};

Webmo.prototype.rotateBy = function rotateBy(diff, speed) {
  var packed = msgpack.encode({type: 'rotateBy', diff: diff, speed: speed});
  this._ws.send(packed);
};

Webmo.prototype.rotateToHome = function rotateToHome() {
  console.log("not impl");
};

//
// Stop
//
Webmo.prototype.stopHard = function stopHard() {
  var packed = msgpack.encode({type: 'stop', hard: true});
  this._ws.send(packed);
};

Webmo.prototype.stopSoft = function stopSoft() {
  var packed = msgpack.encode({type: 'stop', hard: false});
  this._ws.send(packed);
};

Webmo.prototype.stop = function stop() {
  var packed = msgpack.encode({type: 'stop', hard: true});
  this._ws.send(packed);
};

//
// lock
//
Webmo.prototype.lock = function lock() {
  var packed = msgpack.encode({type: 'lock'});
  this._ws.send(packed);
};

Webmo.prototype.unlock = function unlock() {
  var packed = msgpack.encode({type: 'unlock'});
  this._ws.send(packed);
};

//
// goodies
//
Webmo.prototype.tick = function tick(timeMs) {
  var packed = msgpack.encode({type: 'tick', timeMs: timeMs});
  this._ws.send(packed);
};

//
// Home
//
Webmo.prototype.resetHome = function resetHome() {
  console.log("not impl");
};

// helper function
Webmo.prototype.degreeToStep = function degreeToStep(degree) {
  return degree/this.stepDegree;
};

Webmo.prototype.stepToDegree = function stepToDegree(step) {
  return step*this.stepDegree/128; // XXX: microstep must be supplied
};

Webmo.prototype.getSpeedPerSecondByStep = function getSpeedPerSecondByStep(step) {
  return Math.pow(2, 28)*step/Math.pow(10, 9)*250;
};

Webmo.prototype.getSpeedPerSecondByDegree = function getSpeedPerSecondByDegree(degree) {
  return this.getSpeedPerSecondByStep(this.degreeToStep(degree));
};

module.exports = Webmo;

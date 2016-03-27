(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ctx = new (window.AudioContext || window.webkitAudioContext)();
ctx.createBufferSource().start(0);

module.exports = ctx;

},{}],2:[function(require,module,exports){
var audioCtx = require('./audioCtx');
require('stereo-panner-shim');

var b = false;
var oscil = audioCtx.createOscillator();
var gain = audioCtx.createGain();
var pan = audioCtx.createStereoPanner();

oscil.type = 'square';
oscil.frequency.value = 10;
pan.pan.value = 1;

oscil.connect(gain);
gain.connect(pan);
pan.connect(audioCtx.destination);

// touch limitation
document.querySelector('.sq button.start').addEventListener("click", function (e) {
  if (b) {
    gain.gain.value = 0.3;
    document.querySelector('.sq #gain .val').innerHTML = 0.3;
    document.querySelector('.sq #gain input').value = 0.3;
    return;
  }
  oscil.start(0);
  b = true;
});
document.querySelector('.sq button.stop').addEventListener("click", function (e) {
  gain.gain.value = 0;
  document.querySelector('.sq #gain .val').innerHTML = 0;
  document.querySelector('.sq #gain input').value = 0;
});

document.querySelector('.sq #freq input').addEventListener('input', function (e) {
  oscil.frequency.value = e.target.value;
  e.target.parentNode.querySelector('.val').innerHTML = e.target.value;
});

document.querySelector('.sq #gain input').addEventListener('input', function (e) {
  gain.gain.value = e.target.value;
  e.target.parentNode.querySelector('.val').innerHTML = e.target.value;
});
gain.gain.value = document.querySelector('.sq #gain input').value;

module.exports = {
  oscil: oscil,
  gain: gain
};

},{"./audioCtx":1,"stereo-panner-shim":3}],3:[function(require,module,exports){
(function (global){
"use strict";

var AudioContext = global.AudioContext || global.webkitAudioContext;
var StereoPannerNode = require("stereo-panner-node");

if (AudioContext && !AudioContext.prototype.createStereoPanner) {
  AudioContext.prototype.createStereoPanner = function() {
    return new StereoPannerNode(this);
  };
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"stereo-panner-node":6}],4:[function(require,module,exports){
"use strict";

var WS_CURVE_SIZE = 4096;
var curveL = new Float32Array(WS_CURVE_SIZE);
var curveR = new Float32Array(WS_CURVE_SIZE);

(function() {
  for (var i = 0; i < WS_CURVE_SIZE; i++) {
    curveL[i] = Math.cos((i / WS_CURVE_SIZE) * Math.PI * 0.5);
    curveR[i] = Math.sin((i / WS_CURVE_SIZE) * Math.PI * 0.5);
  }
})();

module.exports = {
  L: curveL,
  R: curveR,
};

},{}],5:[function(require,module,exports){
(function (global){
"use strict";

var curve = require("./curve");

/**
 *  StereoPannerImpl
 *  +--------------------------------+  +------------------------+
 *  | ChannelSplitter(inlet)         |  | BufferSourceNode(_dc1) |
 *  +--------------------------------+  | buffer: [ 1, 1 ]       |
 *    |                            |    | loop: true             |
 *    |                            |    +------------------------+
 *    |                            |       |
 *    |                            |  +----------------+
 *    |                            |  | GainNode(_pan) |
 *    |                            |  | gain: 0(pan)   |
 *    |                            |  +----------------+
 *    |                            |    |
 *    |    +-----------------------|----+
 *    |    |                       |    |
 *    |  +----------------------+  |  +----------------------+
 *    |  | WaveShaperNode(_wsL) |  |  | WaveShaperNode(_wsR) |
 *    |  | curve: curveL        |  |  | curve: curveR        |
 *    |  +----------------------+  |  +----------------------+
 *    |               |            |               |
 *    |               |            |               |
 *    |               |            |               |
 *  +--------------+  |          +--------------+  |
 *  | GainNode(_L) |  |          | GainNode(_R) |  |
 *  | gain: 0    <----+          | gain: 0    <----+
 *  +--------------+             +--------------+
 *    |                            |
 *  +--------------------------------+
 *  | ChannelMergerNode(outlet)      |
 *  +--------------------------------+
 */
function StereoPannerImpl(audioContext) {
  this.audioContext = audioContext;
  this.inlet = audioContext.createChannelSplitter(2);
  this._pan = audioContext.createGain();
  this.pan = this._pan.gain;
  this._wsL = audioContext.createWaveShaper();
  this._wsR = audioContext.createWaveShaper();
  this._L = audioContext.createGain();
  this._R = audioContext.createGain();
  this.outlet = audioContext.createChannelMerger(2);

  this.inlet.channelCount = 2;
  this.inlet.channelCountMode = "explicit";
  this._pan.gain.value = 0;
  this._wsL.curve = curve.L;
  this._wsR.curve = curve.R;
  this._L.gain.value = 0;
  this._R.gain.value = 0;

  this.inlet.connect(this._L, 0);
  this.inlet.connect(this._R, 1);
  this._L.connect(this.outlet, 0, 0);
  this._R.connect(this.outlet, 0, 1);
  this._pan.connect(this._wsL);
  this._pan.connect(this._wsR);
  this._wsL.connect(this._L.gain);
  this._wsR.connect(this._R.gain);

  this._isConnected = false;
  this._dc1buffer = null;
  this._dc1 = null;
}

StereoPannerImpl.prototype.connect = function(destination) {
  var audioContext = this.audioContext;
  if (!this._isConnected) {
    this._isConnected = true;
    this._dc1buffer = audioContext.createBuffer(1, 2, audioContext.sampleRate);
    this._dc1buffer.getChannelData(0).set([ 1, 1 ]);

    this._dc1 = audioContext.createBufferSource();
    this._dc1.buffer = this._dc1buffer;
    this._dc1.loop = true;
    this._dc1.start(audioContext.currentTime);
    this._dc1.connect(this._pan);
  }
  global.AudioNode.prototype.connect.call(this.outlet, destination);
};

StereoPannerImpl.prototype.disconnect = function() {
  var audioContext = this.audioContext;
  if (this._isConnected) {
    this._isConnected = false;
    this._dc1.stop(audioContext.currentTime);
    this._dc1.disconnect();
    this._dc1 = null;
    this._dc1buffer = null;
  }
  global.AudioNode.prototype.disconnect.call(this.outlet);
};

module.exports = StereoPannerImpl;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./curve":4}],6:[function(require,module,exports){
"use strict";

var StereoPannerImpl = require("./stereo-panner-impl");

function StereoPanner(audioContext) {
  var impl = new StereoPannerImpl(audioContext);

  Object.defineProperties(impl.inlet, {
    pan: {
      value: impl.pan,
      enumerable: true
    },
    connect: {
      value: function(node) {
        return impl.connect(node);
      }
    },
    disconnect: {
      value: function() {
        return impl.disconnect();
      }
    }
  });

  return impl.inlet;
}

module.exports = StereoPanner;

},{"./stereo-panner-impl":5}]},{},[2]);

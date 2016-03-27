var Webmo = require('./ws');
var nanoKONTROL = require('korg-nano-kontrol');

var Motor = function Motor(selector, host) {
  this.dom = document.querySelector(selector + '> input');
  this.motor = new Webmo(host);
  this.midi = {
    high: 0,
    low: 0,
    inv: false,
    double: false,
    update: (name, val) => {
      this.midi[name] = val;
      this.dom.value = this.midi.calc();

      var e = new Event("input");
      this.dom.dispatchEvent(e);
    },
    calc: () => {
      return (this.midi.high*4 + this.midi.low/2) *(this.midi.inv ? -1 : 1) *
      (this.midi.double ? 2 : 1);
    }
  };

  var valueUpdated = function (val) {
    this.motor.rotate(val);
    var str = val + "<br>" + (360/val).toFixed(2) +" sec/rotate<br>" +
              (val/360*60*4).toFixed(2) + " BPM";
    this.dom.parentNode.querySelector('.rps').innerHTML = str;
  };

  this.dom.addEventListener('input', (e) => {
    console.log(this);
    valueUpdated.call(this, e.target.value);
  });
};


var motor1 = new Motor('.motor1', 'webmo-r2-3.local');
//var motor2 = new Motor('.motor2');

nanoKONTROL.connect()
.then(function(device){
  device.on('slider:6', (val) => {
    motor1.midi.update('high', val);
  });
  device.on('knob:6', (val) => {
    motor1.midi.update('low', val);
  });
  device.on('button:r:6', (val) => {
    motor1.midi.update('inv', val);
  });
  device.on('button:m:6', (val) => {
    motor1.midi.update('double', val);
  });

  device.on('slider:7', (val) => {
    //motor2.midi.update('high', val);
  });
  device.on('knob:7', (val) => {
    //motor2.midi.update('low', val);
  });
  device.on('button:r:7', (val) => {
    //motor2.midi.update('inv', val);
  });
  device.on('button:m:7', (val) => {
    //motor1.midi.update('double', val);
  });
})
.catch(function(err){
  console.error(err);
});

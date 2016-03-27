var audioCtx = require('./audioCtx');
require('stereo-panner-shim');

var b = false;
var oscil = audioCtx.createOscillator();
var gain = audioCtx.createGain();
var pan = audioCtx.createStereoPanner();



oscil.type = 'sine';
oscil.frequency.value = 70;
pan.pan.value = 1;

oscil.connect(gain);
gain.connect(pan);
pan.connect(audioCtx.destination);


// touch limitation
document.querySelector('.cy button.start').addEventListener("click", function(e) {
  if(b) {
    gain.gain.value = 0.3;
    document.querySelector('.cy #gain .val').innerHTML = 0.3;
    document.querySelector('.cy #gain input').value = 0.3;
    return;
  }
  oscil.start(0);
  b = true;
});
document.querySelector('.cy button.stop').addEventListener("click", function(e) {
  gain.gain.value = 0;
  document.querySelector('.cy #gain .val').innerHTML = 0;
  document.querySelector('.cy #gain input').value = 0;
});

document.querySelector('.cy #freq input').addEventListener('input', function(e) {
  oscil.frequency.value = e.target.value;
  e.target.parentNode.querySelector('.val').innerHTML = e.target.value;
});

document.querySelector('.cy #gain input').addEventListener('input', function(e) {
  gain.gain.value = e.target.value;
  e.target.parentNode.querySelector('.val').innerHTML = e.target.value;
});


module.exports = {
  oscil: oscil,
  gain: gain
};

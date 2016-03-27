var shim = require("@mohayonao/web-audio-api-shim/light");
var audioCtx = require('./audioCtx');
var b = false;

var gain = audioCtx.createGain();
var bufferSize = 2 * audioCtx.sampleRate,
    noiseBuffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate),
    outputL = noiseBuffer.getChannelData(0);
    //outputR = noiseBuffer.getChannelData(1);
for (var i = 0; i < bufferSize; i++) {
    outputL[i] = Math.random() * 2 - 1;
    //outputR[i] = Math.random() * 2 - 1;
}

var whiteNoise = audioCtx.createBufferSource();
whiteNoise.buffer = noiseBuffer;
whiteNoise.loop = true;

whiteNoise.connect(gain);
gain.connect(audioCtx.destination);

// touch limitation
document.querySelector('.wn button.start').addEventListener("click", function(e) {
  if (b) {
    gain.gain.value = 0.3;
    document.querySelector('.wn #gain .val').innerHTML = 0.3;
    document.querySelector('.wn #gain input').value = 0.3;
    return;
  }
  whiteNoise.start(0);
  b = true;
});
document.querySelector('.wn button.stop').addEventListener("click", function(e) {
  gain.gain.value = 0;
  document.querySelector('.wn #gain .val').innerHTML = 0;
  document.querySelector('.wn #gain input').value = 0;
});

document.querySelector('.wn #gain input').addEventListener('input', function(e) {
  gain.gain.value = e.target.value;
  e.target.parentNode.querySelector('.val').innerHTML = e.target.value;
});
gain.gain.value = document.querySelector('.wn #gain input').value;


module.exports = {
  oscil: whiteNoise,
  gain: gain
};

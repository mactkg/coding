var ctx = new (window.AudioContext || window.webkitAudioContext)();
ctx.createBufferSource().start(0);

module.exports = ctx;

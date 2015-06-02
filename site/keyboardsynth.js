var wave;
var fft;
var currentFreq;
var currentKey;
var bgColor;

var noteMap = {
  'Z': 4,
  'S': 5,
  'X': 6,
  'D': 7,
  'C': 8,
  'V': 9,
  'G': 10,
  'B': 11,
  'H': 12,
  'N': 13,
  'J': 14,
  'M': 15,
  0xBC: 16, // ','
  'L': 17,
  0xBE: 18, // '.'
  0xBA: 19, // ';'
  0xBF: 20, // '/'
  'Q': 16,
  '2': 17,
  'W': 18,
  '3': 19,
  'E': 20,
  'R': 21,
  '5': 22,
  'T': 23,
  '6': 24,
  'Y': 25,
  '7': 26,
  'U': 27,
  'I': 28,
  '9': 29,
  'O': 30,
  '0': 31,
  'P': 32,
  0xDB: 33, // '['
  0xDD: 35 // ']'
};
var waveMap = {};

var octave = 4;
var currentAmp = 0.6;
var active = false;
var normalOctave = true;

function setup() {
  createCanvas(512, 200);
  cursor(CROSS);
  strokeWeight(1);
  noFill();
  bgColor = floor(map(currentAmp, 0, 1, 0, 64));
  
  waveMap[LEFT_ARROW] = new p5.SinOsc();
  waveMap[DOWN_ARROW] = new p5.TriOsc();
  waveMap[RIGHT_ARROW] = new p5.SawOsc();
  waveMap[UP_ARROW] = new p5.SqrOsc();
  waveMap[SHIFT] = new p5.Pulse();
  
  wave = waveMap[DOWN_ARROW];
  wave.amp(0);
  wave.start();
  fft = new p5.FFT();
}

function draw() {
  var i;
  var waveform = fft.waveform();
  var len = waveform.length / 2;
  background(bgColor);
  stroke(127);
  beginShape();
  for (i = 0; i < len; i += 1) {
    var y = map(waveform[i], -1, 1, 0, height);
    vertex(i, y);
  }
  endShape();
  
  stroke(255);
  text("Hz: " + currentFreq, 5, 15);
  text("Octave: " + octave, 5, 30);
}

function keyPressed() {
  var noteNum = noteMap[keyCode <= 0x5A ? key : keyCode];
  if (key !== currentKey && noteNum !== undefined) {
    currentFreq = toHz(noteNum);
    wave.freq(currentFreq);
    wave.amp(currentAmp);
    active = true;
    currentKey = key;
  } else if (keyCode === 0xDC && normalOctave) { // '\\'
    octave += 1;
    currentFreq *= 2;
    wave.freq(currentFreq);
    normalOctave = false;
  } else if (keyCode === 0xBB) { // '='
    octave += 1;
    if (octave > 38) {
      octave = 38;
    }
  } else if (keyCode === 0xBD) { // '-'
    octave -= 1;
    if (octave < 0) {
      octave = 0;
    }
  }
}

function keyReleased() {
  if (key === currentKey) {
    wave.amp(0.0);
    active = false;
    currentKey = '';
  } else if (keyCode === 0xDC) { // '\\'
    octave -= 1;
    currentFreq /= 2;
    wave.freq(currentFreq);
    normalOctave = true;
  } else {
    var WaveType = waveMap[keyCode];
    if (WaveType !== undefined) {
      wave.stop();
      wave = WaveType;
      wave.freq(currentFreq);
      if (active) {
        wave.amp(currentAmp);
      } else {
        wave.amp(0);
      }
      wave.start();
    }
  }
}

function mouseMoved() {
  currentAmp = constrain(map(mouseX, 0.0, width, 0.0, 1.0), 0, 1);
  bgColor = floor(map(currentAmp, 0, 1, 0, 64));
  if (active) {
    wave.amp(currentAmp, 0.01);
  }
}

function toHz(noteNum) {
  var octNote = noteNum + 12 * (octave - 1);
  var freq = pow(2.0, (octNote - 49.0) / 12.0) * 440.0;
  return freq;
}

var wave;
var note;
var frequency;
var volume;
var noteWidth;
var recorder;
var soundFile;

var waveMap = {};

var numNotes = 88;
var maxNote = numNotes + 1;
var quantize = false;
var inactive = true;
var octave = false;
var recording = false;
var light = 95;
var stripes = [light, 0, light, light, 0, light, 0, light, light, 0, light, 0];

function setup() {
  createCanvas(windowWidth < 1000 ? windowWidth : 1000, 200);
  cursor(CROSS);
  
  waveMap['1'] = new p5.SinOsc();
  waveMap['2'] = new p5.TriOsc();
  waveMap['3'] = new p5.SawOsc();
  waveMap['4'] = new p5.SqrOsc();
  waveMap['5'] = new p5.Pulse();
  
  wave = waveMap['4'];
  wave.amp(0);
  wave.start();
  noteWidth = width / numNotes;
}

function draw() {
  var i;
  stroke(159, 0, 0);
  if (mouseIsPressed) {
    note = constrain(map(mouseX, 0.0, width, 1.0, maxNote), 1.0, numNotes);
    if (quantize) {
      note = floor(note);
    }
    if (octave) {
      note += 12.0;
    }
    frequency = pow(2.0, (note - 49.0) / 12.0) * 440.0;
    wave.freq(frequency, quantize || inactive ? 0 : 0.015);
    volume = constrain(map(mouseY, 0.0, height, 1.0, 0.0), 0.0, 1.0);
    wave.amp(volume, 0.01);
    if (inactive) {
      inactive = false;
    }
  }
  for (i = 0; i < numNotes; i += 1) {
    fill(stripes[i % 12]);
    rect(i * noteWidth, -1, noteWidth, height + 1);
  }
  stroke(255); // instead of fill
  text("Note #: " + note, 10, 20);
  text("Hz: " + frequency, 10, 40);
  if (recording) {
    text("RECORDING", 10, 60);
  }
}

function mouseReleased() {
  wave.amp(0.0);
  inactive = true;
}

function keyPressed() {
  switch (key) {
  case 'O':
    octave = true;
    break;
  default:
    break;
  }
}

function keyReleased() {
  switch (key) {
  case 'O':
    octave = false;
    break;
  case 'Q':
    quantize = !quantize;
    break;
  case 'R':
    if (!recording) {
      recorder = new p5.SoundRecorder();
      soundFile = new p5.SoundFile();
      recorder.record(soundFile);
      recording = true;
    } else {
      recorder.stop();
      save(soundFile, 'output.wav');
      recording = false;
    }
    break;
  default:
    var WaveType = waveMap[key];
    if (WaveType !== undefined) {
      wave.stop();
      wave = WaveType;
      wave.freq(frequency);
      if (inactive) {
        wave.amp(0);
      } else {
        wave.amp(volume);
      }
      wave.start();
    }
    break;
  }
}

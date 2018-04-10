'use strict';

const { spawn } = require('child_process');
const { MjpegServer,  MjpegStream } = require('../index');

// const server = new MjpegServer(8081, 8082);
const server = new MjpegServer(8081);
const stream = new MjpegStream();

stream.on('data', server.broadcast.bind(server));

// ffmpeg example 
const proc = spawn('ffmpeg', [
	'-hwaccel', 'dxva2', // hardware acceleration
	'-rtbufsize', '100M', // buffer
	'-f', 'dshow', // input
	'-i', 'video=Logitech Webcam 300', // device
	'-c:v', 'mjpeg', // codec
	'-q:v', '5', // quality
	'-huffman', 'optimal', // compression
	'-f', 'mjpeg', // output format
	'-r', '25', // fromerate
	'-an', // no audio
	'-' // stdout
], {
	detached: true
});

// pipe stdout to mjpeg stream
proc.stdout.pipe(stream);

// ffmpeg log
proc.stderr.on('data', (data) => {
	// console.log(data.toString());
});
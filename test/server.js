'use strict';

const { spawn } = require('child_process');
const { MjpegServer,  MjpegStream } = require('../index');

const videoparams = [
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
];

// const server = new MjpegServer(8081, 8082);
const server = new MjpegServer(8081);

let ffmpeg = null; // ffmpeg process
let connections = 0; // active connections

server.socketServer.on('connection', (client) => {

	connections++;

	if(ffmpeg === null){

		// if ffmpeg is not running, create a new stream and fire it up
		const stream = new MjpegStream();

		stream.on('data', server.broadcast.bind(server));

		ffmpeg = spawn('ffmpeg', videoParams, { detached: true });

		// pipe stdout to mjpeg stream
		ffmpeg.stdout.pipe(stream);

		ffmpeg.stderr.on('data', (data) => {
			console.log('stderr: ' + data);
		});

		ffmpeg.on('close', (code) => {
			stream.destroy();
			console.log('ffmpeg stream closed');
		});
	}

	client.on('close', (code, message) => {

		connections--;

		if(connections === 0 && ffmpeg !== null){
			process.kill(-ffmpeg.pid);
			ffmpeg = null;
		}
	});
});
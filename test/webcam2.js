const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { MjpegServer,  MjpegStream } = require('../index');

let fontPath = path.join(__dirname, 'roboto-mono.ttf');
// windows fix
if(os.platform() === 'win32'){
	fontPath = fontPath.replace(/\\/g, '\\\\').replace(':', '\\:');
}

// devices:
// Logitech HD Webcam C270
// Logitech Webcam 300
const videoParams = [
	'-re',
	'-i', 'bescherung.mp4', // device
	'-vf', 'drawtext=fontfile=\'' + fontPath + '\':text=%{localtime}:fontsize=11:fontcolor=\'white\':boxcolor=0x000000AA:box=1:x=10:y=10',
	'-c:v', 'mjpeg', // codec
	'-q:v', '0', // quality
	'-huffman', 'optimal', // compression
	'-f', 'mjpeg', // output format
	// '-r', '30', // framerate
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

		ffmpeg = spawn('ffmpeg', videoParams, { detached: true });

		// pipe stdout to mjpeg stream
		ffmpeg.stdout.on('data', server.broadcast.bind(server));

		ffmpeg.stderr.on('data', (data) => {
			console.log('stderr: ' + data);
		});

		ffmpeg.on('close', (code) => {
			console.log('ffmpeg stream closed');
		});
	}

	client.on('close', (code, message) => {

		connections--;

		if(connections === 0 && ffmpeg !== null){
			ffmpeg.kill();
			ffmpeg = null;
		}
	});
});
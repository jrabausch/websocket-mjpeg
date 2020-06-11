const { spawn } = require('child_process');
const { MjpegServer,  MjpegStream } = require('../index');

const videoParams = [
	'-re',
	'-i', 'rtsp://192.168.178.50/Streaming/channels/1', // stream
	// '-acodec', 'copy',
	'-c:v', 'mjpeg', // codec
	'-q:v', '0', // quality
	'-huffman', 'optimal', // compression
	'-f', 'mjpeg', // output format
	// '-r', '15', // framerate
	'-an', // no audio
	'-' // stdout
];

const server = new MjpegServer(8081);

let ffmpeg = null; // ffmpeg process
let connections = 0; // active connections

server.socketServer.on('connection', (client) => {

	connections++;

	if(ffmpeg === null){

		// if ffmpeg is not running, create a new stream and fire it up
		const stream = new MjpegStream();

		stream.on('data', server.broadcast.bind(server));

		ffmpeg = spawn('./ffmpeg', videoParams, { detached: true });

		// pipe stdout to mjpeg stream
		ffmpeg.stdout.pipe(stream);

		ffmpeg.stderr.on('data', (data) => {
			// console.log('stderr: ' + data);
		});

		ffmpeg.on('close', (code) => {
			stream.destroy();
			ffmpeg = null;
			console.log('ffmpeg stream closed');
		});
	}

	client.on('close', (code, message) => {

		connections--;

		if(connections === 0 && ffmpeg !== null){
			ffmpeg.kill();
			// ffmpeg = null;
		}
	});
});
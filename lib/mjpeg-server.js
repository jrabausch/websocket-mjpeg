'use strict';

const WebSocket = require('ws');
const http = require('http');
const MjpgStream = require('./mjpeg-stream');

const CLIENT_NEXT_FRAME = String.fromCharCode(0x01);

class MjpegServer{

	constructor(socketPort, httpPort){

		this.socketServer = new WebSocket.Server({port: socketPort, perMessageDeflate: false});
		this.socketServer.on('connection', this.socketHandle.bind(this));

		if(httpPort){

			this.httpServer =  http.createServer(this.httpHandle.bind(this)).listen(httpPort);
		}
	}

	socketHandle(client){

		// TODO: send stream info
		// client.send(JSON.stringify({
		// 	width: 640,
		// 	height: 480,
		//  fps: 25
		// }));

		client.on('message', (message) => {

			switch(message){
				case CLIENT_NEXT_FRAME:
					client.nextFrame = true;
				break;
			}
		});
	
		client.on('close', (code, message) => {
			// TODO: cleanup
		});
	}

	httpHandle(request, response){

		response.connection.setTimeout(0);

		const mjpgStream = new MjpgStream();
		mjpgStream.on('data', this.broadcast.bind(this));

		request.pipe(mjpgStream);
	}

	broadcast(data){

		this.socketServer.clients.forEach((client) => {

			if(client.readyState === WebSocket.OPEN && client.nextFrame){

				client.nextFrame = false;
				client.send(data);
			}
		});
	}
}

module.exports = MjpegServer;
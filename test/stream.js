const http = require('http');
const { MjpegServer,  MjpegStream } = require('../index');

const stream = new MjpegStream();
const server = new MjpegServer(8081);

stream.on('data', server.broadcast.bind(server));

const request = http.get('http://192.168.178.73/Streaming/channels/1/httppreview', (response) => {

    response.pipe(stream);
});

request.on('error', (err) => {

    console.log(err);
})
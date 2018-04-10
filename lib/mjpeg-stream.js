'use strict';

const { Transform } = require('stream');
const fs = require('fs');

const JPEG_SOI = String.fromCharCode(0xff, 0xd8);
const JPEG_EOI = String.fromCharCode(0xff, 0xd9);

class MjpegStream extends Transform{

	constructor(options = {}){

		super(options);

		this.maxImageSize = options.maxImageSize || 8388608; // 8 MB
		this.buffer = '';
	}

	_transform(chunk, encoding, callback){

		this.buffer += chunk.toString('binary');

		const start = this.buffer.indexOf(JPEG_SOI);
		const end = this.buffer.indexOf(JPEG_EOI);

		if(start >= 0 && end >= 0){
		
			const image = this.buffer.substring(start, end + 2);
			this.buffer = this.buffer.substring(end + 2);

			this.push(Buffer.from(image, 'binary'));
		}

		// reset buffer when max image size is reached
		if(this.buffer.length > this.maxImageSize){
			this.buffer = '';
		}

		callback();
	}

	_flush(callback){

		callback();
	}

	_final(callback){

		this._buffer = '';

		callback();
	}
};

module.exports = MjpegStream;
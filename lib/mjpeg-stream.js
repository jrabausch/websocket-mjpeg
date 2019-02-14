'use strict';

const { Transform } = require('stream');

const JPEG_SOI = String.fromCharCode(0xff, 0xd8);
const JPEG_EOI = String.fromCharCode(0xff, 0xd9);

class MjpegStream extends Transform{

	constructor(options = {}){

		super(options);

		this.buffer = '';
		this.level = 0;
	}

	_transform(chunk, encoding, callback){

		let data = chunk.toString('binary');
		let start, end, next;

		do{

			start = data.indexOf(JPEG_SOI);
			end = data.indexOf(JPEG_EOI);
			next = Math.min(start, end);

			if(next < 0){

				next = Math.max(start, end);
			}

			if(next >= 0){

				if(next === start){ // soi

					if(this.level > 0){ // inside of image

						this.buffer += data.substring(0, next + 2);
					}
					else{ // new outer image

						this.buffer = JPEG_SOI;
					}

					this.level++;
				}
				else{ // eoi

					if(this.level > 0){

						this.level--;
					}

					this.buffer += data.substring(0 , next + 2);

					if(this.level === 0){ // end of outer image

						this.push(Buffer.from(this.buffer, 'binary'));
						this.buffer = '';
					}
				}

				data = data.substring(next + 2);
			}
			else if(this.level > 0){ // no markers and inside of image

				this.buffer += data;
			}

		}while(next >= 0);

		callback();
	}

	_flush(callback){

		callback();
	}

	_final(callback){

		this.buffer = '';
		this.level = 0;

		callback();
	}
};

module.exports = MjpegStream;
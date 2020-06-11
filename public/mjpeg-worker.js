var MjpegStream = (function(){

	var JPEG_SOI = String.fromCharCode(0xff, 0xd8);
	var JPEG_EOI = String.fromCharCode(0xff, 0xd9);

	var MjpegStream = function(){

		this.pushData = function(){};

		// TOOD: implement max buffer size
		this.buffer = new Uint8Array([]);
		this.level = 0;
	};
	
	var mp = MjpegStream.prototype;
	
	mp.push = function(data){
	
		this.transform(data);
	};
	
	mp.transform = function(data){
	
		var start, end, next;
	
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
	
						this.buffer += data.substring(0, next + JPEG_SOI.length);
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
	
					this.buffer += data.substring(0 , next + JPEG_EOI.length);
	
					if(this.level === 0){ // end of outer image
	
						this.pushData(Buffer.from(this.buffer, 'binary'));
						this.buffer = '';
					}
				}
	
				data = data.substring(next + JPEG_EOI.length);
			}
			else if(this.level > 0){ // no markers and inside of image
	
				this.buffer += data;
			}
	
		}while(next >= 0);
	};
	
	// jp.pipe = function
	
	mp.onData = function(callback){
	
		if(typeof callback === 'function'){
			
			this.pushData = callback;
		}
	};

	mp.reset = function(){

		this.buffer = '';
		this.level = 0;
	};


	return MjpegStream;

})();


var stream = new MjpegStream();

stream.onData(postMessage);

onmessage = function(data){
	stream.push(data);
};
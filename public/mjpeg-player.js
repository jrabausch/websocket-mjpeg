(function(context){

	'use strict';

	var NEXT_FRAME_MESSAGE = String.fromCharCode(0xe6);

	var OPTION_DEFAULTS = {
		autoplay: true,
		drawInfo: false
	};

	function extend(obj1, obj2){
		var extended = {};
		for(var key in obj1){
			extended[key] = obj1[key];
			if(obj2 && obj2.hasOwnProperty(key)){
				extended[key] = obj2[key];
			}
		}
		return extended;
	}

	var MjpegPlayer = function(url, canvas, options){

		this.options = extend(OPTION_DEFAULTS, options);

		this.ctx = canvas.getContext('2d');

		this.preloadImage = new Image();
		this.preloadImage.addEventListener('load', this.onImageChange.bind(this));
		this.preloadImage.addEventListener('error', this.onImageChange.bind(this));

		this.isPlaying = false;
		this.lastDate = new Date();
		this.frameCount = 0;
		this.lastFames = 0
		this.loadedData = 0;

		this.socket = new WebSocket(url);
		this.socket.binaryType = 'blob';
		this.socket.addEventListener('open', this.onSocketOpen.bind(this));
		this.socket.addEventListener('message', this.onSocketMessage.bind(this));
	};

	var mp = MjpegPlayer.prototype;

	mp.onSocketOpen = function(){
		if(this.options.autoplay){
			this.play();
		}
	};

	mp.onSocketMessage = function(message){
		if(typeof message.data === 'string'){
			var data = JSON.parse(message.data);
			// TODO: use stream info
			console.log(data);
		}
		else if(this.isPlaying){ // blob -> image data
			this.preloadImage.src = URL.createObjectURL(message.data);
			this.loadedData += message.data.size;
		}
	};

	mp.onImageChange = function(e){
		if(e.type === 'load'){
			this.drawFrame();
		}
		URL.revokeObjectURL(this.preloadImage.src);
	};

	mp.drawFrame = function(){
		var width = this.ctx.canvas.width;
		var height = this.ctx.canvas.height;

		this.ctx.drawImage(this.preloadImage, 0, 0, width, height);

		if(this.options.drawInfo){
			this.drawMisc();
		}

		// request next frame
		if(this.socket.readyState === WebSocket.OPEN){
			this.socket.send(NEXT_FRAME_MESSAGE);
		}
	};

	mp.drawMisc = function(){

		var date = new Date();

		this.ctx.font = '11px Consolas,Arial,Helvetica,sans-serif';
		this.ctx.fillStyle = 'white';
		this.ctx.strokeStyle = 'black';
		this.ctx.lineWidth = 2;
		this.ctx.lineJoin = 'round';
		this.ctx.textAlign = 'left';
		var timeString = date.toISOString()/*.replace('T', ' ').replace('Z', '')*/;
		this.ctx.strokeText(timeString, 10, this.ctx.canvas.height - 10);
		this.ctx.fillText(timeString, 10, this.ctx.canvas.height - 10);

		if(date.getSeconds() !== this.lastDate.getSeconds()){
			this.lastFames = this.frameCount;
			this.frameCount = 0;
			this.lastDate = date;
		}
		else{
			this.frameCount++;
		}

		var fps = 1 / (1 / this.lastFames);
		var frameText = (this.loadedData / 1024 / 1024).toFixed(2) + 'M ' + (fps < 10 ? '0' + fps : '' + fps) + 'F';

		this.ctx.textAlign = 'right';
		this.ctx.strokeText(frameText, this.ctx.canvas.width - 10, this.ctx.canvas.height - 10);
		this.ctx.fillText(frameText, this.ctx.canvas.width - 10, this.ctx.canvas.height - 10);
	};

	mp.play = function(){
		this.isPlaying = true;
		if(this.socket.readyState === WebSocket.OPEN){
			this.socket.send(NEXT_FRAME_MESSAGE);
		}
	};

	mp.pause = function(){
		this.isPlaying = false;
	};

	mp.togglePlay = function(){
		this.isPlaying ? this.pause() : this.play();
	};

	context.MjpegPlayer = MjpegPlayer;

})(this);
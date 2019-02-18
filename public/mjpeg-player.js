(function(context){

	'use strict';

	var NEXT_FRAME_MESSAGE = String.fromCharCode(0xe6);

	var IMAGE_SIZE_STRETCH = 0;
	var IMAGE_SIZE_CONTAIN = 1;
	var IMAGE_SIZE_COVER = 2;

	var OPTION_DEFAULTS = {
		autoplay: true,
		drawInfo: false,
		imageSize: IMAGE_SIZE_CONTAIN
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
		
		window.addEventListener('resize', this.onWindowResize.bind(this));
	};

	MjpegPlayer.IMAGE_SIZE_STRETCH = IMAGE_SIZE_STRETCH;
	MjpegPlayer.IMAGE_SIZE_CONTAIN = IMAGE_SIZE_CONTAIN;
	MjpegPlayer.IMAGE_SIZE_COVER = IMAGE_SIZE_COVER;

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
		else{ // blob -> image data
			URL.revokeObjectURL(this.preloadImage.src);
			this.preloadImage.src = URL.createObjectURL(message.data);
			this.loadedData += message.data.size;
		}
	};

	mp.onImageChange = function(e){
		if(e.type === 'load'){
			this.drawFrame();
		}
		
		// request next frame
		if(this.isPlaying && this.socket.readyState === WebSocket.OPEN){
			this.socket.send(NEXT_FRAME_MESSAGE);
		}
	};

	mp.onWindowResize = function(e){

		setTimeout(this.drawFrame.bind(this), 0);
	};

	mp.drawFrame = function(){

		var canvasWidth = this.ctx.canvas.width;
		var canvasHeight = this.ctx.canvas.height;

		// clear canvas
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		var width = canvasWidth;
		var height = canvasHeight;
		var top = 0;
		var left = 0;

		if(this.options.imageSize !== IMAGE_SIZE_STRETCH){

			var canvasRatio = canvasWidth / canvasHeight;

			var imageWidth = this.preloadImage.naturalWidth;
			var imageHeight = this.preloadImage.naturalHeight;
			var imageRatio = imageWidth / imageHeight;

			var takeHeight = this.options.imageSize === IMAGE_SIZE_COVER ? imageRatio > canvasRatio : imageRatio < canvasRatio;

			if(takeHeight){

				height = canvasHeight;
				width = height * imageRatio;
				left = (canvasWidth - width) / 2;
			}
			else{
	
				width = canvasWidth;
				height = width / imageRatio;
				top = (canvasHeight - height) / 2;
			}
		}

		this.ctx.drawImage(this.preloadImage, left, top, width, height);

		if(this.options.drawInfo){
			this.drawMisc();
		}
	};

	mp.drawMisc = function(){

		var width = this.ctx.canvas.width;
		var height = this.ctx.canvas.height;

		var date = new Date();
		var fontHeight = 11;

		this.ctx.font = fontHeight + 'px Consolas,Arial,Helvetica,sans-serif';
		this.ctx.fillStyle = 'white';
		this.ctx.strokeStyle = 'black';
		this.ctx.lineWidth = 2;
		this.ctx.lineJoin = 'round';
		this.ctx.textAlign = 'left';
		var timeString = date.toISOString()/*.replace('T', ' ').replace('Z', '')*/;
		this.ctx.strokeText(timeString, 10, height - 10);
		this.ctx.fillText(timeString, 10, height - 10);

		if(date.getSeconds() !== this.lastDate.getSeconds()){
			this.lastFames = this.frameCount;
			this.frameCount = 0;
			this.lastDate = date;
		}
		else{
			this.frameCount++;
		}

		var fps = Math.ceil(1 / (1 / this.lastFames));
		var frameText = (this.loadedData / 1024 / 1024).toFixed(2) + 'M ' + (fps < 10 ? '0' + fps : '' + fps) + 'F';

		this.ctx.textAlign = 'right';
		this.ctx.strokeText(frameText, width - 10, height - 10);
		this.ctx.fillText(frameText, width - 10, height - 10);

		var state = 'PLAYING';
		var stateFill = '#00cca0';
		
		if(!this.isPlaying){
			state = 'PAUSED';
			stateFill = '#e74dbb';
		}

		this.ctx.fillStyle = stateFill;
		this.ctx.fillRect(10, height - fontHeight - 22, 50, fontHeight);
		this.ctx.fillStyle = 'white';
		this.ctx.textAlign = 'center';
		this.ctx.fillText(state, 35, height - 24);
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

	context.MjpegPlayer = Object.freeze(MjpegPlayer);

})(this);
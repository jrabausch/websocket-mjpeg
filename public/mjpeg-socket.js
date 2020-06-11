(function(context){

	var NEXT_FRAME = String.fromCharCode(0xe6);

	var JpegSocket = function(callback){

		this.callback = callback;
		this.isPlaying = false;
		this.url = '';
		this.socket = null;
	};

	var jp = JpegSocket.prototype;

	jp.connect = function(url){

		this.url = url;
		this.socket = new WebSocket(url); 
		this.socket.binaryType = 'blob';
		this.socket.addEventListener('open', this.socketOpen.bind(this));
		this.socket.addEventListener('message', this.socketMessage.bind(this));
		this.socket.addEventListener('close', this.socketClose.bind(this));
	};

	jp.socketOpen = function(e){
		if(this.isPlaying){
			this.socket.send(NEXT_FRAME);
		}
	};

	jp.socketMessage = function(message){

		if(typeof message.data === 'string'){
			console.log(message.data);
		}
		else{
			if(this.isPlaying && this.socket.readyState === WebSocket.OPEN){
				this.socket.send(NEXT_FRAME);
			}
			typeof this.callback === 'function' && this.callback(message.data);
		}
	};

	jp.socketClose = function(e){

		this.isPlaying = false;
	};

	jp.reconnect = function(){

		if(this.url.length){

			this.connect(this.url);
		}
	};

	jp.play = function(){
		
		if(!this.isPlaying){

			this.isPlaying = true;

			if(this.socket.readyState === WebSocket.OPEN){
				this.socket.send(NEXT_FRAME);
			}
		}
	};

	jp.pause = function(){
		this.isPlaying = false;
	};

	context.JpegSocket = JpegSocket;

})(window);
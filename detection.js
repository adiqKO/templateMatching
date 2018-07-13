/*
for chrome: --allow-file-access-from-files
*/


const shapes = {

};

const processor = {
	load(video) {
		this.video = video;
		this.width = video.videoWidth;
		this.height = video.videoHeight;
		this.canvas = document.createElement('canvas');
		this.canvas.width  = this.width;
		this.canvas.height = this.height;
		document.body.appendChild(this.canvas);
		this.ctx = this.canvas.getContext('2d');
	
	},
	frame() {
		this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
		const data = this.ctx.getImageData(0, 0, this.width, this.height);
		console.log(data);
	},
	timer() {
		if (this.video.paused || this.video.ended) {
      		return;
    	}
		this.frame();
		let self = this;
		setTimeout(function () {
			self.timer();
		}, 5000);
	}
};

if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined) {
	navigator.mediaDevices.getUserMedia({video: true})
		.then(function (stream) {
			const video = document.querySelector('video');
	        video.src = window.URL.createObjectURL(stream);
	        video.onloadedmetadata = function (event) {
				processor.load(this);
				processor.timer();
	        };
		})
		.catch(function (err) {
			// Błąd w wyborze kamery
		});
} else {
    // Brak obsługi kamery przez przeglądarke
}

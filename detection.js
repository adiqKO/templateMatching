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
		let userImageData = this.ctx.getImageData(0, 0, this.width, this.height);
		let myObject = createTemplate(userImageData.data,240,148,userImageData.width,userImageData.height,mask);
		var imgData=this.ctx.createImageData(myObject.width,myObject.height);
	
		for (var i=0;i<imgData.data.length;i+=4)
  			{
  				imgData.data[i+0] = myObject.data[i];
  				imgData.data[i+1]= myObject.data[i+1];
  				imgData.data[i+2]= myObject.data[i+2];
  				imgData.data[i+3]= myObject.data[i+3];
  			}
	
		this.ctx.putImageData(imgData,imgData.width,imgData.height);
	},
	timer() {
		if (this.video.paused || this.video.ended) {
      		return;
    	}
		this.frame();
		let self = this;
		setTimeout(function () {
			self.timer();
		}, 10000);
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

function createMask(imgdata, width, height) {
	let data = [];
	for (let  i = 0; i < imgdata.length; i += 4)
		data.push(imgdata[i] === 255 ? 1 : 0);
	return { width: width, height: height, data: data };
};

function createTemplate(imgdata, xOffset, yOffset, width, height, mask) {
	let data = [];
	for (let y = 0; y < mask.height; ++y) {
		for (let x = 0; x < mask.width; ++x) {
			let i = y * mask.width + x;
			let j = ((y + yOffset) * width + (x + xOffset)) * 4;
			if (mask.data[i] === 1) {
				data.push(imgdata[j], imgdata[j + 1], imgdata[j + 2], 255);
			} else {
				data.push(255, 255, 255, 255);
			}
		}
	}
	return { width: mask.width, height: mask.height, data: data };
};

function calculateSqDiff(imgdata, xOffset, yOffset, width, height, template, mask, best) {
	let sum = 0;
	for (let y = 0; y < template.height; ++y) {
		for (let x = 0; x < template.width; ++x) {
			let m = (y * template.width + x);
			let i = m * 3;
			let j = ((y + yOffset) * width + (x + xOffset)) * 4;
			if (mask.data[m] === 1) {
				sum += Math.pow(template.data[i] - imgdata[j] + template.data[i + 1] - imgdata[j + 1] + template.data[i + 2] - imgdata[j + 2], 2);
				if (sum > best.value || sum > 100000000) {
					return 999999999;
				}
			}
		}
	}
	return sum;
};
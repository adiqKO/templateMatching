/*
for chrome: --allow-file-access-from-files
*/
let templateImage;
let imgData;
let check = false;
const shapes = {

};

const EXTRACTION = 1;
const ANALYSIS = 2;
const processor = {
	mode: EXTRACTION,
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
	},
	timer() {
		if (this.video.paused || this.video.ended) {
      		return;
    	}
		let self = this;
		if (this.mode === EXTRACTION) {
			setTimeout(() => {
				self.frame();
				self.template();
				self.mode = ANALYSIS;
				self.timer();
			}, 5500);
		} else if (this.mode === ANALYSIS) {
			setTimeout(() => {
				self.frame();
				setTimeout(() => {
					self.analyzeImage();
					//self.timer();
				}, 1000);
			}, 3000);
		}
	},
	template() {
		console.log('Getting template...');
		this.userImageData = this.ctx.getImageData(0, 0, this.width, this.height);
		templateImage = createTemplate(this.userImageData.data, 240, 148, this.userImageData.width, this.userImageData.height, mask);
		imgData = this.ctx.createImageData(templateImage.width, templateImage.height);
		check = true;
		for (var i=0;i<imgData.data.length;i+=4)
  			{
				imgData.data[i+0] = templateImage.data[i];
				imgData.data[i+1] = templateImage.data[i+1];
				imgData.data[i+2] = templateImage.data[i+2];
				imgData.data[i+3] = templateImage.data[i+3];
  			}
		console.log('... finished.');
	},
	analyzeImage(){
		let userImageData2 = this.ctx.getImageData(0, 0, this.width, this.height);
		console.log('Analysing...');
		console.time('total');
		let best = { x: null, y: null, value: 999999999 };
		for (let y = 0; y < userImageData2.height - templateImage.height + 1; ++y) {
			for (let x = 0; x <userImageData2.width - templateImage.width + 1; ++x) {
				let value = calculateSqDiff(userImageData2.data, x, y, userImageData2.width, userImageData2.height, templateImage, mask, best);
				if (best.x === null || value < best.value) {
					best = { x: x, y: y, value: value };
				}
			}
		}
		this.ctx.fillStyle = 'green';
		this.ctx.fillRect(best.x, best.y, templateImage.width, templateImage.height);
		console.timeEnd('total');
		console.log('...finished.');
		console.log(best);
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
};

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
			let i = m * 4;
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

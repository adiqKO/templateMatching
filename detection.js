/*
for chrome: --allow-file-access-from-files
*/

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
			}, 4000);
		} else if (this.mode === ANALYSIS) {
			setTimeout(() => {
				self.frame();
				setTimeout(() => {
					self.analyzeImage();
					setTimeout(() => {
						self.timer();
					}, 10);
				}, 290);
			}, 700);
		}
	},
	template() {
		console.log('Getting template...');
		this.userImageData = this.ctx.getImageData(0, 0, this.width, this.height);
		this.templateImage = createTemplate(this.userImageData.data, 122, 148, this.userImageData.width, this.userImageData.height, mask2);
		this.templateImage = scaleImage(this.templateImage.data, this.templateImage.width, this.templateImage.height, 40,46);
		
		let canvas = document.createElement('canvas');
        canvas.width  = this.templateImage.width;
		canvas.height = this.templateImage.height;
		let context = canvas.getContext('2d');
		context.putImageData(new ImageData(
			Uint8ClampedArray.from(this.templateImage.data),
			this.templateImage.width,
			this.templateImage.height
		), 0, 0);
		document.body.appendChild(canvas);

		console.log('... finished.');
	},
	analyzeImage(){
		let userImageData2 = this.ctx.getImageData(0, 0, this.width, this.height);
		userImageData2 = scaleImage(userImageData2.data, userImageData2.width, userImageData2.height, 160, 120);

		console.log('Analysing...');
		console.time('total');
		let best = { x: null, y: null, value: 999999999 };
		for (let y = 0; y < userImageData2.height - this.templateImage.height + 1; ++y) {
			for (let x = 0; x <userImageData2.width - this.templateImage.width + 1; ++x) {
				let value = calculateSqDiff(userImageData2.data, x, y, userImageData2.width, userImageData2.height, this.templateImage, mask3, best);
				if (best.x === null || value < best.value) {
					best = { x: x, y: y, value: value };
				}
			}
		}
		this.ctx.fillStyle = 'green';
		this.ctx.fillRect(best.x*4, best.y*4, this.templateImage.width*4, this.templateImage.height*4);
		console.timeEnd('total');
		console.log('...finished.');
		console.log(best.value);
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
			let i = y * mask.width + mask.width - x - 1;
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
			if (mask.data[m] === 1) {
				let i = m * 4;
				let j = ((y + yOffset) * width + (x + xOffset)) * 4;
				sum += Math.pow(template.data[i] - imgdata[j] + template.data[i + 1] - imgdata[j + 1] + template.data[i + 2] - imgdata[j + 2], 2);
				if (sum > best.value || sum > 30000000) {
					return 999999999;
				}
			}
		}
	}
	return sum;
};

function scaleImage(imgDataScal, w1, h1, w2, h2){
	let out =[];
	scaleX = ((w1<<16)/w2)+1;
	scaleY = ((h1<<16)/h2)+1;
	let px,py;
	for(let j = 0; j < h2; j++){
		for(let i = 0; i < w2; i++){
			px = ((i*scaleX)>>16);
			py = ((j*scaleY)>>16);
			idx = (py * w1 + px)*4;
			out.push(imgDataScal[idx], imgDataScal[idx+1], imgDataScal[idx+2], imgDataScal[idx+3]);
		}
	}
	return { width: w2, height: h2, data: out };
};
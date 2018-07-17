/*
for chrome: --allow-file-access-from-files
*/

// Szablony
const templates = [
    {
        name: 'hand',
        maskUrl: 'templates/hand/mask_160x184.png',
        outlineUrl: 'templates/hand/outline_160x184.png',
        width: 160,
        height: 184
    }
];

// Stany
const EXTRACTION = 1;
const ANALYSIS = 2;

const templateService = {
    current: 0,
    outline() {
        const el = document.getElementById('outline');
        el.style.marginLeft = '-' + (templates[this.current].width / 2) + 'px';
        el.style.marginTop = '-' + (templates[this.current].height / 2) + 'px';
        el.style.backgroundImage = templates[this.current].outlineUrl;
    }
};

const processor = {
	mode: EXTRACTION,
    init() {
        if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined) {
            navigator.mediaDevices.getUserMedia({video: true})
                .then(function (stream) {
                    const video = document.querySelector('video');
                    video.src = window.URL.createObjectURL(stream);
                    video.onloadedmetadata = function (event) {
                        this.load(this);
                        this.timer();
                    };
                })
                .catch(function (err) {
                    console.log('An input device error.');
                });
        } else {
            console.log('Your browser is too old.');
        };
    },
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
            templateService.outline();
			setTimeout(() => {
				self.frame();
				self.template(); // todo
				self.mode = ANALYSIS;
				self.timer();
			}, 5000);
		} else if (this.mode === ANALYSIS) {
			setTimeout(() => {
				self.frame();
				setTimeout(() => {
					self.analyzeImage(); // todo
				}, 1000);
			}, 3000);
		}
	}
};

// Wczytywanie masek
let promises = [];
for (let i = 0; i < templates.length; ++i) {
    let promise = new Promise((resolve) => {
        var mask = new Image(templates[i].width, templates[i].height);
        mask.onload = function () {
            let canvas = document.createElement('canvas');
            canvas.width  = templates[i].width;
            canvas.height = templates[i].heigth;
            let context = canvas.getContext('2d');
            context.drawImage(this, 0, 0);
            let data = context.getImageData(0, 0, templates[i].width, templates[i].height).data;
            templates[i].mask = [];
            for (let j = 0; j < data.length; j += 4)
                templates[i].mask.push(data[j] === 255 ? 1 : 0);
            resolve();
        };
        mask.src = templates[i].maskUrl;
    });
    promises.push(promise);
}
Promise.all(promises).then(() => {
    console.log('All templates\' masks are downloaded.');
    processor.init();
});

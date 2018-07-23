const Jimp = require("jimp");
const Module = require('./../build/c_functions.js');

Promise.all([
    new Promise((resolve) => { Module.onRuntimeInitialized = () => resolve(); }),
    new Promise((resolve) => Jimp.read("001.jpg", (err, image) => resolve(image))),
    new Promise((resolve) => new Jimp(640, 480, (err, image) => resolve(image)))
]).then(function(images) {
    const length = images[1].bitmap.width * images[1].bitmap.height;
    
    const offset = Module._malloc(length + 8);
    
    Module.setValue(offset, images[1].bitmap.width, 'i32');
    Module.setValue(offset + 4, images[1].bitmap.height, 'i32');
    Module.HEAPU8.set(images[1].bitmap.data.buffer, offset + 8);
    
    console.log(Module.getValue(offset, 'i32'));
    console.log(Module.getValue(offset + 4, 'i32'));
    
    images[1].bitmap.data.buffer = Module.HEAPU8.slice(8, length + 8);
    images[1].write('out2.jpg');
});

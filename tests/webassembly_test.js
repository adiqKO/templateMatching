const Module = require('./../build/c_functions.js');

Module.onRuntimeInitialized = () => {
    const convertRGBA2Luma = Module.cwrap('convertRGBA2Luma', null, ['number', 'number', 'number']);
    const offset = Module._malloc(40);
    Module.HEAPU32.set(new Int32Array([100,0,0,0,50,0,0,0]), offset / 4);
    convertRGBA2Luma(2, offset, offset + 32);
    console.log(Module.getValue(offset + 32, 'i32'));
    console.log(Module.getValue(offset + 36, 'i32'));
    console.log('done.');
};

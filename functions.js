module.exports = {
    createMask(imgdata, width, height) {
        let data = [];
        for (let  i = 0; i < imgdata.length; i += 4)
            data.push(imgdata[i] === 255 ? 1 : 0);
        return { width: width, height: height, data: data };
    },
    createTemplate(imgdata, xOffset, yOffset, width, height, mask) {
        let data = [];
        for (let y = 0; y < mask.height; ++y) {
            for (let x = 0; x < mask.width; ++x) {
                let i = y * mask.width + x;
                let j = ((y + yOffset) * width + (x + xOffset)) * 4;
                if (mask.data[i] === 1) {
                    data.push(imgdata[j], imgdata[j + 1], imgdata[j + 2]);
                } else {
                    data.push(255, 255, 255);
                }
            }
        }
        return { width: mask.width, height: mask.height, data: data };
    },
    calculateSqDiff(imgdata, xOffset, yOffset, width, height, template, mask, best) {
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
    },
};

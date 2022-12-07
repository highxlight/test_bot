let tf = require('@tensorflow/tfjs-node');
const normalize = {
    /**
     * Function to return the normalize data set back
     * @param tensor the tensor dataset
     * @returns [normalizedTensor, labelMax, labelMin]
     */
    normalizeTensorFit: (tensor) => {
        const labelMax = tensor.max();
        const labelMin = tensor.min();
        const normalizedTensor = normalize.normalizeTensor({
            tensor,
            labelMax: labelMax,
            labelMin: labelMin,
        });
        return [normalizedTensor, labelMax, labelMin];
    },
    /**
     * Function that to give back the normalizedTensor
     * @param tensor the tensor dataset
     * @param labelMax The max of the tensor
     * @param labelMin The min of the tensor
     * @returns normalizedTensor
     */
    normalizeTensor: (obj) => {
        const normalizedTensor = obj.tensor.sub(obj.labelMin).div(obj.labelMax.sub(obj.labelMin));
        return normalizedTensor;
    },
    /**
     * Unnormalize the input data and output the visualize data
     * @param tensor
     * @param labelMax
     * @param labelMin
     * @returns
     */
    unNormalizeTensor: (obj) => {
        const unNormTensor = obj.tensor.mul(obj.labelMax.sub(obj.labelMin)).add(obj.labelMin);
        return unNormTensor;
    },
};

/**
 * 使用指定模型进行未来价格预测
 * @param modelPath ai模型文件根路径
 * @param closePrices 收盘价格
 * @param size 预测个数
 * @param timestampForLastClosePrice  预测开始时间
 * @returns {Promise<{nextPrices_set: *[], recent_time: number}>}
 */
async function nextNPrice(modelPath, closePrices, size, timestampForLastClosePrice) {
    let recent_time = Date.now();
    let nextPrices_set = [],
        next_price,
        data;
    let price_model = await tf.loadLayersModel(`file://./${modelPath}/model.json`);
    let x = closePrices.map((val) => {
        return parseFloat(val);
    });
    for (let i = 0; i < size; i++) {
        if (i > 0) {
            x = x.slice(1, x.length);
            x.push(next_price);
        }
        let [xs_norm, inputMax, inputMin] = normalize.normalizeTensorFit(tf.tensor(x));
        let pred_nextPrices = Array.from(normalize.unNormalizeTensor({ tensor: price_model.predict(xs_norm.reshape([1, x.length, 1])), labelMin: inputMin, labelMax: inputMax }).dataSync()).map((val) => {
            return Number(val.toFixed(8));
        });
        timestampForLastClosePrice = timestampForLastClosePrice + 60000;
        next_price = pred_nextPrices[0];
        nextPrices_set.push({
            next_price,
            timestamp: timestampForLastClosePrice,
        });
    }
    return { recent_time, nextPrices_set };
}

module.exports = { nextNPrice };

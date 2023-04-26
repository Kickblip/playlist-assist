const euclideanDistance = (vector1, vector2) => {
    let result = 0;
    for (let i = 0; i < vector1.length; i++) {
        result += (vector1[i] - vector2[i]) ** 2;
    };
    return Math.sqrt(result);
};

const normalize = (vector) => {
    const mean = vector.reduce((a, b) => a + b) / vector.length;
    const stdDev = Math.sqrt(
        vector.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vector.length - 1)
    );
    return vector.map((val) => (val - mean) / stdDev);
};


module.exports = { euclideanDistance, normalize };
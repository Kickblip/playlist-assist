const euclideanDistance = (arr1, arr2) => {
    let result = 0;
    for (let i = 0; i < arr1.length; i++) {
        result += (arr1[i] - arr2[i]) ** 2;
    };
    return Math.sqrt(result);
};


module.exports = { euclideanDistance };
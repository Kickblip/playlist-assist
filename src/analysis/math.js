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

const vectorizeSegment = (segment, keys) => {

    let vector = segment.map(segment => {
        return {
            id: feature.id,
            vector: [
                feature.acousticness,
                feature.danceability,
                feature.energy,
                feature.instrumentalness,
                feature.key,
                feature.liveness,
                feature.loudness,
                feature.mode,
                feature.speechiness,
                feature.tempo,
                feature.time_signature,
                feature.valence
            ]
        };
    });

}


module.exports = { euclideanDistance, normalize, vectorizeSegment };
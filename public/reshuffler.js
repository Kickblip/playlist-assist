const organizeQueue = async (playback_queue) => {

    // concatenate all the track IDs into a single string seperated by commas
    let track_ids = playback_queue.map(track => track.id).join(',');

    // get the audio features for all the tracks in the queue
    let audio_features = await $.ajax({
        url: "https://api.spotify.com/v1/audio-features",
        method: "GET",
        data: {
            ids: track_ids
        },
        headers: {
            "Authorization": `Bearer ${access_token}` // Replace {access_token} with a valid access token
        }
    }).catch(err => console.log(err));

    console.log(audio_features)

    // Extract the relevant feature values from each object
    audio_features = audio_features.audio_features.map(feature => {
        return {                            // example values:
            id: feature.id,                 // 6y0igZArWVi6Iz0rj35c1Y
            vectors: [
                feature.acousticness,       // 0.0339
                feature.danceability,       // 0.557
                feature.energy,             // 0.54
                feature.instrumentalness,   // 0.00248
                feature.key,                // 9
                feature.liveness,           // 0.179
                feature.loudness,           // -10.484
                feature.mode,               // 1
                feature.speechiness,        // 0.0347
                feature.tempo,              // 129.171
                feature.time_signature,     // 4
                feature.valence,            // 0.394
            ]
        };
    });

    console.log(audio_features)

    // store the features of the first song because it needs to remain constant
    const current_song = audio_features[0];


    // Define the number of clusters you want to use
    const numClusters = 5;

    // Define a function to calculate the Euclidean distance between two vectors
    function euclideanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += (a[i] - b[i]) ** 2;
        }
        return Math.sqrt(sum);
    }

    // Define a function to randomly initialize the cluster centroids
    function initializeCentroids(vectors, numClusters) {
        const centroids = [];
        for (let i = 0; i < numClusters; i++) {
            const randomIndex = Math.floor(Math.random() * vectors.length);
            centroids.push(vectors[randomIndex]);
        }
        return centroids;
    }

    // Define a function to assign each vector to the closest cluster centroid
    function assignToClusters(vectors, centroids) {
        const clusters = Array.from({ length: numClusters }, () => []);
        for (let i = 0; i < vectors.length; i++) {
            let closestCentroid = null;
            let closestDistance = Infinity;
            for (let j = 0; j < centroids.length; j++) {
                const distance = euclideanDistance(vectors[i], centroids[j]);
                if (distance < closestDistance) {
                    closestCentroid = j;
                    closestDistance = distance;
                }
            }
            clusters[closestCentroid].push(vectors[i]);
        }
        return clusters;
    }

    // Define a function to calculate the new cluster centroids based on the current assignments
    function calculateNewCentroids(clusters) {
        const centroids = [];
        for (let i = 0; i < clusters.length; i++) {
            if (clusters[i].length === 0) {
                // If a cluster has no vectors, reinitialize its centroid randomly
                centroids.push(initializeCentroids([clusters], 1)[0]);
            } else {
                const centroid = clusters[i][0].map((_, j) =>
                    clusters[i].reduce((sum, vector) => sum + vector[j], 0) / clusters[i].length
                );
                centroids.push(centroid);
            }
        }
        return centroids;
    }

    // Define a function to check if the cluster assignments have converged
    function hasConverged(oldAssignments, newAssignments) {
        for (let i = 0; i < oldAssignments.length; i++) {
            if (oldAssignments[i].length !== newAssignments[i].length) {
                return false;
            }
            for (let j = 0; j < oldAssignments[i].length; j++) {
                if (oldAssignments[i][j] !== newAssignments[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    // Run the K-means algorithm
    let centroids = initializeCentroids(audio_features.vectors, numClusters);
    let assignments = [];
    let converged = false;
    while (!converged) {
        assignments = assignToClusters(audio_features.vectors, centroids);
        const newCentroids = calculateNewCentroids
            (assignments);
        converged = hasConverged(assignments, assignToClusters(audio_features.vectors, newCentroids));
        centroids = newCentroids;
    }

    // Once the clustering is complete, sort the vectors within each cluster based on their distance to the centroid
    for (let i = 0; i < assignments.length; i++) {
        assignments[i].sort((a, b) => {
            const distanceToCentroidA = euclideanDistance(a, centroids[i]);
            const distanceToCentroidB = euclideanDistance(b, centroids[i]);
            return distanceToCentroidA - distanceToCentroidB;
        });
    }

    // Concatenate the vectors within each cluster to get your final sorted list
    const sortedVectors = assignments.flat();

};


export { organizeQueue };
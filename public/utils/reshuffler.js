const organizeQueue = async (playback_queue) => {

    //log the duration of every song in the playback queue
    playback_queue.forEach(song => {
        // convert the duration from ms to a human-readable format like x:xx
        let min = Math.floor(song.duration_ms / 60000);
        let sec = ((song.duration_ms % 60000) / 1000).toFixed(0);
        if (sec == 60) {
            sec = '00';
            min++;
        }
        if (sec < 10) sec = '0' + sec;
        const timestamp = `${min}:${sec}`;
        console.log(song.name, song.duration_ms, timestamp);
    });


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

    console.log(audio_features);

    audio_features = audio_features.audio_features.map(feature => {
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



    // store the features of the first song because it needs to remain constant
    const current_song = audio_features[0];

    const normalize = (vector) => {
        const mean = vector.reduce((a, b) => a + b) / vector.length;
        const stdDev = Math.sqrt(
            vector.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vector.length - 1)
        );
        return vector.map((val) => (val - mean) / stdDev);
    };

    const cosineSimilarity = (vectorA, vectorB) => {
        vectorA = normalize(vectorA);
        vectorB = normalize(vectorB);

        if (vectorA.length !== vectorB.length) {
            throw new Error('Vectors must be of the same length');
        }

        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            magnitudeA += vectorA[i] * vectorA[i];
            magnitudeB += vectorB[i] * vectorB[i];
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }

        return dotProduct / (magnitudeA * magnitudeB);
    }

    let queue = audio_features.slice(1);
    let organized_queue = [current_song];


    const organizeQueue = (queue, current_song, organized_queue = []) => {
        if (queue.length === 0) {
            return organized_queue;
        }

        let highest_similarity = 0;
        let highest_similarity_index = 0;

        for (let i = 0; i < queue.length; i++) {
            const similarity = cosineSimilarity(current_song.vector, queue[i].vector);
            if (similarity > highest_similarity) {
                highest_similarity = similarity;
                highest_similarity_index = i;
            }
        }

        organized_queue.push(queue[highest_similarity_index]);
        queue.splice(highest_similarity_index, 1);

        return organizeQueue(queue, current_song, organized_queue);
    };
    organizeQueue(queue, current_song, organized_queue);


    console.log(audio_features);
    console.log(organized_queue);


    // use the organized IDs from the organized_queue to reorganize the playback_queue in the same order
    let new_playback_queue = [];
    for (let i = 0; i < organized_queue.length; i++) {
        for (let j = 0; j < playback_queue.length; j++) {
            if (playback_queue[j].id === organized_queue[i].id) {
                new_playback_queue.push(playback_queue[j]);
            }
        }
    }



    return new_playback_queue;


};


export { organizeQueue };
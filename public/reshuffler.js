const organizeQueue = async (playback_queue) => {

    // concatenate all the track IDs into a single string seperated by commas
    let track_ids = playback_queue.map(track => track.id).join(',');

    // get the audio features for all the tracks in the queue
    audio_features = await $.ajax({
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
    audio_features = audio_features.map(feature => {
        return [
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
            feature.valence,
        ];
    });

    // store the features of the first song because it needs to remain constant
    const current_song = audio_features[0];

};


export { organizeQueue };
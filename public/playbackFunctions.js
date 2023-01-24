const getPlaybackQueue = () => {

    $.ajax({
        url: '/get-queue',
        data: {
            'access_token': access_token
        }
    }).done((response => {

        const playback_queue = response.playback_queue;
        const fetch_time = ((Date.now()-response.timestamp) + response.fulfillment_time);

        return {
            'playback_queue': playback_queue,
            'fetch_time': fetch_time
        };

    }))
};


const getAnalysis = (access_token, current_song, next_song) => {

    $.ajax({
        url: '/get-analysis',
        data: {
            'access_token': access_token,
            'current_song_id': current_song.id,
            'next_song_id': next_song.id
        }
    }).done((response) => {

        const analysis_array = response.analysis_array;
        const fetch_time = ((Date.now()-response.timestamp) + response.fulfillment_time);

        return {
            'analysis_array': analysis_array,
            'fetch_time': fetch_time
        };
    });

};


const selectNewJump = () => {

    const target_timestamp = analysis_array[Math.floor(Math.random() * analysis_array.length)];
    jump_ms = target_timestamp[0];

};


const updateStage = (current_song, next_song) => {

    document.getElementById('song-1-img').src = `${current_song.album.images[1].url}`;
    document.getElementById('song-2-img').src = `${next_song.album.images[1].url}`;
    document.getElementById('player-header').innerText = `Now Playing ${current_song.name}`;

};


const skipToNext = async (token, track_id, target_ms, target_id) => {

    fetch(`https://api.spotify.com/v1/me/player/play${target_id && `?device_id=${target_id}`}`, {
        method: "PUT",
        body: JSON.stringify({ "uris": [`spotify:track:${track_id}`], "position_ms": target_ms }),
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).catch(e => console.error(e));

    console.log(`skipToNext function triggered`);

};


const getPlaybackState = () => {

    $.ajax({
        url: '/get-state',
        data: {
            'access_token': access_token
        }
    }).done((response) => {
        if (response.playback_state) {

            /*
            time how long it takes to complete the calculations on the request
            take unix timestamp right before sending the response 
            take timestamp when the response is received
            take the difference between timestamps then add them to the calculation timer
            */

            const playback_state = response.playback_state;
            const fetch_time = ((Date.now()-response.timestamp) + response.fulfillment_time);
    
            return {
                'playback_state': playback_state,
                'fetch_time': fetch_time
            };

        } else {
            console.log(`getPlaybackState failed with error: ${response.error_code}`)

        };
    });
};
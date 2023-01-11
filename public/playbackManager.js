document.getElementById('start-listener').addEventListener('click', function () {

    // event.preventDefault();
    // figure out a way to do this ^

    $.ajax({
        url: '/check-state',
        data: {
            'access_token': access_token,
        }
    }).done(function (response) {

        // get state, queue, and analysis for the first two tracks from player state endpoint

        let playback_state = response.playback_state;
        let playback_queue = response.playback_queue;
        let analysis_array = response.analysis_array;
        let device_id = playback_state.device.id;


        console.log(playback_state);
        console.log(playback_queue);
        console.log(analysis_array);

        let current_song = playback_queue.currently_playing;
        let next_song = playback_queue.queue[0];


        // pick a target segment from the array 
        let target_timestamp = analysis_array[Math.floor(Math.random() * analysis_array.length)]

        // get target/jump ms values
        let jump_ms = target_timestamp[0];
        let landing_ms = target_timestamp[1];

        console.log(`jumping at ${jump_ms}ms and landing at ${landing_ms}ms`);


        /*
        time how long it takes to complete the calculations on the request
        take unix timestamp right before sending the response 
        take timestamp when the response is received
        take the difference between timestamps then add them to the calculation timer
        */
        const request_time = (Date.now() - response.timestamp) + response.fulfillment_time;

        console.log(`setup took: ${request_time}ms`);

        // calculate user's current progress in the song based on request delay

        const interval = 100; // ms
        let current_progress = playback_state.progress_ms + request_time;

        console.log(`current timestamp: ${current_progress}ms`);

        setTimeout(step, interval);
        function step() {
            const dt = Date.now() - current_progress; // the drift (positive for overshooting)
            if (dt > interval) {
                // special handling to deal with unexpectedly large drift
            }
            // check if player is within range of the jump
            if (current_progress <= jump_ms + 50 && current_progress >= jump_ms - 50) {
                skipToNext(access_token, next_song.id, landing_ms, device_id);
                console.log(`skipping from ${current_song.name} to ${next_song.name}`);
            } else if (current_progress > jump_ms + 50) {
                // pick a new jump target
            }

            // update current progress with state fetches to account for changes

            current_progress += interval;
            setTimeout(step, Math.max(0, interval - dt)); // take into account drift
        };

    });

}, false);



const getTrackAnalysis = async (token, trackId) => {

    const result = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data;
};

const getSegmentMS = async (token, trackId, targetSegment) => {

    const target_song = await getTrackAnalysis(token, trackId);

    const target_ms = (target_song.segments[targetSegment].start * 1000);

    return target_ms;

};

const skipToNext = async (token, track_id, target_ms, target_id) => {

    fetch(`https://api.spotify.com/v1/me/player/play${target_id && `?device_id=${target_id}`}`, {
        method: "PUT",
        body: JSON.stringify({ "uris": [`spotify:track:${track_id}`], "position_ms": target_ms }),
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).catch(e => console.error(e));

};
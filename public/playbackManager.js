let playback_state;
let playback_queue;
let analysis_array;
let device_id;

let current_song;
let next_song;
let playlist_position = 0;

let state_setup_time;

let target_timestamp;
let jump_ms;
let landing_ms;


// problem: didnt actually make the jump


document.getElementById('start-listener').addEventListener('click', function () {

    // event.preventDefault();
    // figure out a way to do this ^

    $.ajax({
        url: '/check-state',
        data: {
            'access_token': access_token,
        }
    }).done(function (response) {

        state_setup_time = (Date.now() - response.timestamp) + response.fulfillment_time;

        // get state, queue, and analysis for the first two tracks from player state endpoint

        playback_state = response.playback_state;
        playback_queue = response.playback_queue;
        device_id = playback_state.device.id;

        current_song = playback_queue.currently_playing;
        next_song = playback_queue.queue[0];

        restartPlaybackManager();

    });

}, false);

const restartPlaybackManager = () => {

    console.log('RESTARTING PLAYBACK MANAGER');

    // get a current state 
    if (playback_state.is_playing) {

        // get track analysis using request
        $.ajax({
            url: '/get-analysis',
            data: {
                'access_token': access_token,
                'current_song_id': current_song.id,
                'next_song_id': next_song.id
            }
        }).done((response) => {

            const loader_start = Date.now()

            // update html with currently playing song 
            updateStage(current_song, next_song);


            // retrieve the analysis data from response
            analysis_array = response.analysis_array;

            // pick a target segment from the array (random for now)
            target_timestamp = analysis_array[Math.floor(Math.random() * analysis_array.length)];

            // set target/jump ms values
            jump_ms = target_timestamp[0];
            landing_ms = target_timestamp[1];

            console.log(`jumping at ${jump_ms}ms and landing at ${landing_ms}ms`);

            /*
            time how long it takes to complete the calculations on the request
            take unix timestamp right before sending the response 
            take timestamp when the response is received
            take the difference between timestamps then add them to the calculation timer
            */

            const analysis_setup_time = (Date.now() - response.timestamp) + response.fulfillment_time;

            const loader_end = Date.now();

            const total_setup_time = analysis_setup_time + state_setup_time + (loader_end - loader_start);
            console.log(`setup took: ${total_setup_time}ms`);

            // calculate user's current progress in the song based on request delay
            let current_progress = playback_state.progress_ms + total_setup_time;

            const interval = 100; // ms

            console.log(`current progress: ${current_progress}ms`);

            setTimeout(step, interval);
            function step() {
                console.log(current_progress);
                const dt = Date.now() - current_progress; // the drift (positive for overshooting)
                if (dt > interval) {
                    // special handling to deal with unexpectedly large drift
                }
                // check if player is within 50 ms of the jump
                if (current_progress >= jump_ms - 100 && current_progress <= jump_ms + 100) {
                    skipToNext(access_token, next_song.id, landing_ms, device_id).then(() => {

                        playlist_position++;
                        current_song = playback_queue.queue[playlist_position];
                        next_song = playback_queue.queue[playlist_position + 1];

                        playback_state = null;
                        restartPlaybackManager();
                        return;

                    }).catch(err => console.log(err));
                    console.log(`skipping from ${current_song.name} to ${next_song.name}`);

                } else if (current_progress > jump_ms + 50) {
                    console.log('jump missed, picking a new target jump');
                    // pick a new jump target
                    selectNewJump();
                }

                // update current progress with state fetches to account for changes

                current_progress += interval;
                // setTimeout(step, Math.max(0, interval - dt));
                setTimeout(step, interval); // take into account drift? (possible point of delay)
            };


        });

    } else {

        console.log(`state refused by playback manager, restarting...`);

        $.ajax({
            url: '/get-state',
            data: {
                'access_token': access_token
            }
        }).done((response) => {
            if (response.playback_state) {

                state_setup_time = (Date.now() - response.timestamp) + response.fulfillment_time;
                playback_state = response.playback_state;

                restartPlaybackManager();
            } else {
                if (response.error_code) {
                    console.log(`get state failed with error: ${response.error_code}`);
                } else {
                    console.log('I have no idea what went wrong, good luck');
                };
            };
        });
    };

};


const getPlaybackState = () => {

    $.ajax({
        url: '/get-state',
        data: {
            'access_token': access_token
        }
    }).done((response) => {
        if (response.playback_state) {

            const playback_state = response.playback_state;
            const fetch_time = ((Date.now()-response.timestamp) + response.fulfillment_time);
    
            return {
                'playback_state': playback_state,
                'fetch_time': fetch_time
            };

        } else {
            console.log(`getPlaybackState failed with error: ${response.error_code}`)

        }
    });
};

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
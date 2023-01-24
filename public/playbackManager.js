let playlist_position = 0;
let playback_queue;
let current_song;
let next_song;

document.getElementById('start-listener').addEventListener('click', function () {

    // event.preventDefault();
    // figure out a way to do this ^

    $.ajax({
        url: '/check-state',
        data: {
            'access_token': access_token,
        }
    }).done(function (response) {

        // state_setup_time = (Date.now() - response.timestamp) + response.fulfillment_time;

        // // get state, queue, and analysis for the first two tracks from player state endpoint

        // playback_state = response.playback_state;
        // playback_queue = response.playback_queue;
        // device_id = playback_state.device.id;

        // current_song = playback_queue.currently_playing;
        // next_song = playback_queue.queue[0];

        playback_queue = response.playback_queue;

        restartPlaybackManager();

    });

}, false);

const restartPlaybackManager = async () => {

    console.log('RESTARTING PLAYBACK MANAGER');


    /*
    TODO:
    1. streamline serverside listener so it only passes queue through once it 
    finds a valid state

    2. Move API calls to clientside (except for analysis)

    3. Create a system for organizing an entire playlist by tempo and bpm
    */

    // get a current state and queue
    const playbackStateFetch = await getPlaybackState();
    // const playbackQueueFetch = await getPlaybackQueue();

    playback_state = playbackQueueFetch.playback_state;
    const device_id = playback_state.device_id;
    // playback_queue = playbackStateFetch.playback_queue;

    const state_fetch_ms = playbackStateFetch.fetch_time;
    // const queue_fetch_ms = playbackQueueFetch.fetch_time;

    current_song = playback_queue.currently_playing;
    next_song = playback_queue.queue[playlist_position];

    const analysisFetch = await getAnalysis(access_token, current_song, next_song);

    const analysis_array = analysisFetch.analysis_array;
    const analysis_fetch_ms = analysisFetch.fetch_time;


    const loader_start = Date.now();

    updateStage(current_song, next_song)

    // pick a target segment from the array (random for now)
    let target_timestamp = analysis_array[Math.floor(Math.random() * analysis_array.length)];
    
    // set target/jump ms values
    let jump_ms = target_timestamp[0];
    let landing_ms = target_timestamp[1];

    console.log(`jumping at ${jump_ms}ms and landing at ${landing_ms}ms`);


    const loader_end = Date.now();

    const total_setup_time = analysis_fetch_ms + state_fetch_ms + queue_fetch_ms + (loader_end - loader_start);
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
        // check if player is within 100 ms of the jump
        if (current_progress >= jump_ms - 100 && current_progress <= jump_ms + 100) {
            skipToNext(access_token, next_song.id, landing_ms, device_id).then(() => {

                playlist_position++;
                current_song = playback_queue.queue[playlist_position];
                next_song = playback_queue.queue[playlist_position + 1];

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
};
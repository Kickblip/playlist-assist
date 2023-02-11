let playlist_position = 0;
let playback_queue;
let queue_fetch_ms;
let current_song;
let next_song;
let player_started = false;

import Player from './player.js';


document.getElementById('start-listener').addEventListener('click', function () {

    event.preventDefault();
    // figure out a way to do this ^

    $.ajax({
        url: '/check-state',
        data: {
            'access_token': access_token,
        }
    }).done(function (response) {

        playback_queue = response.playback_queue;
        queue_fetch_ms = (Date.now() - response.timestamp) + response.fulfillment_time;

        current_song = playback_queue.currently_playing;
        next_song = playback_queue.queue[playlist_position];

        console.log(playback_queue);

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

    Problems:
    timer doesnt stop when a jump is made so it starts counting from null
    getState doesnt get state of current song, only seems to get state from initial song 
    after a jump is made the client side queue is only one song so if they restart the app it freaks out on a jump
    */

    let player = new Player(current_song, next_song, access_token);

    const dataTimers = await player.gatherData();

    const analysis_fetch_ms = dataTimers.analysis_fetch_ms;
    const state_fetch_ms = dataTimers.state_fetch_ms;


    const loader_start = Date.now();
    player.updateStage();
    player.setTimestamps();
    const loader_end = Date.now();


    console.log(`analysis fetch time: ${analysis_fetch_ms}ms`);
    console.log(`state fetch time: ${state_fetch_ms}ms`);
    console.log(`queue fetch time: ${queue_fetch_ms}ms`);
    console.log(`loader time: ${loader_end - loader_start}ms`);

    const total_setup_time = analysis_fetch_ms + state_fetch_ms + queue_fetch_ms + (loader_end - loader_start);
    console.log(`setup took: ${total_setup_time}ms`);


    // calculate user's current progress in the song based on request delay
    let current_progress = player.playback_state.progress_ms + total_setup_time;


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
        if (current_progress >= player.jump_ms - 100 && current_progress <= player.jump_ms + 100) {
            player.skipToNext().then(() => {

                current_song = playback_queue.queue[playlist_position];
                console.log(`new current song: ${current_song.name}`);

                playlist_position++; // increase by one for next song in queue
                next_song = playback_queue.queue[playlist_position];
                console.log(`new next song: ${next_song.name}`);

                current_progress = null;
                player = null;

                restartPlaybackManager();
                return;

            }).catch(err => console.log(err));

        } else if (current_progress > player.jump_ms + 50) {
            console.log('jump missed, picking a new target jump');
            // pick a new jump target
            player.selectNewJump();
        }

        // update current progress with state fetches to account for changes
        if (current_progress) {
            current_progress += interval;
            // setTimeout(step, Math.max(0, interval - dt));
            setTimeout(step, interval); // take into account drift? (possible point of delay)
        };

    };
};



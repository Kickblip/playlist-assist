let playlist_position = 0;
let playback_queue;
let queue_fetch_ms;
let current_song;
let next_song;
let current_progress = 0;

import Player from './player.js';
import Timer from './timer.js';

/*

TODO:
1. create a system for organizing an entire playlist by tempo and bpm
3. change the algorithm 
4. periodically sync the users live state with the server
5. optimize for speed (reduce timer interval?)
6. restrict scopes to only what is needed
6. cleanup time!
7. standardize var names
8. add comments
9. add stop button
10. profit

PROBLEMS:
2. after a jump is made the client side queue is only one song so if they restart the app it freaks out on a jump

*/

document.getElementById('start-listener').addEventListener('click', function () {

    // prevent this function from being called multiple times by multiple presses of the button
    this.disabled = true;

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


    let player = new Player(current_song, next_song, access_token);

    const dataTimers = await player.gatherData();

    const analysis_fetch_ms = dataTimers.analysis_fetch_ms;
    const state_fetch_ms = dataTimers.state_fetch_ms;


    const loader_start = Date.now();
    player.setTimestamps();
    player.updateStage(playback_queue);
    const loader_end = Date.now();


    console.log(`analysis fetch time: ${analysis_fetch_ms}ms`);
    console.log(`state fetch time: ${state_fetch_ms}ms`);
    console.log(`queue fetch time: ${queue_fetch_ms}ms`);
    console.log(`loader time: ${loader_end - loader_start}ms`);

    const total_setup_time = analysis_fetch_ms + state_fetch_ms + queue_fetch_ms + (loader_end - loader_start);
    console.log(`setup took: ${total_setup_time}ms`);


    // calculate user's current progress in the song based on request delay
    console.log('progress_ms: ' + player.playback_state.progress_ms + 'ms');
    console.log('total setup time: ' + total_setup_time + 'ms');

    current_progress = player.playback_state.progress_ms + total_setup_time;
    let target_date = Date.now() + (playback_queue.currently_playing.duration_ms - current_progress);
    console.log(target_date);
    console.log(`current progress: ${current_progress}ms`);

    let timer = new Timer(() => {
        // code that is ran on every interval
    }, 100, target_date,
        () => {
            // special handling to deal with unexpectedly large drift
            console.log('tokyo drift')

        },
        () => {
            // time to jump to the next song
            player.skipToNext().then(() => {
                // TODO: jump doesnt work with new timer

                current_song = playback_queue.queue[playlist_position];
                console.log(`new current song: ${current_song.name}`);

                playlist_position++; // increase by one for next song in queue
                next_song = playback_queue.queue[playlist_position];
                console.log(`new next song: ${next_song.name}`);

                // reset timer and player to shut them up
                player = null;
                timer = null;

                // wait 3 second before restarting playback manager to allow for spotify to update
                setTimeout(restartPlaybackManager, 5000);

                return;

            }).catch(err => console.log(err));

        },
        () => {
            // missed the target date, oopsie :P
        });

    timer.start();




};

// player.syncPlayer().then(() => {
//     current_progress = player.playback_state.progress_ms;
//     console.log(`synced player, new progress: ${current_progress}ms`);
// }).catch(err => console.log(err))

// const interval = 100; // ms
// setTimeout(step, interval);
// function step() {
//     // console.log(current_progress);
//     const dt = Date.now() - current_progress; // the drift (positive for overshooting)
//     if (dt > interval) {
//         // special handling to deal with unexpectedly large drift
//         // player.syncPlayer().then(() => {
//         //     current_progress = player.playback_state.progress_ms;
//         //     console.log(`synced player, new progress: ${current_progress}ms`);
//         // }).catch(err => console.log(err))
//     }
//     // check if player is within 100 ms of the jump
//     if (current_progress >= player.jump_ms - interval && current_progress <= player.jump_ms + interval && !player.jumped) {
//         player.skipToNext().then(() => {

//             current_song = playback_queue.queue[playlist_position];
//             console.log(`new current song: ${current_song.name}`);

//             playlist_position++; // increase by one for next song in queue
//             next_song = playback_queue.queue[playlist_position];
//             console.log(`new next song: ${next_song.name}`);

//             current_progress = 0;
//             player = null;

//             clearTimeout(step);

//             // wait 3 second before restarting playback manager to allow for spotify to update
//             setTimeout(restartPlaybackManager, 3000);

//             return;

//         }).catch(err => console.log(err));

//     } else if (current_progress > player.jump_ms + 50) {
//         console.log('jump missed, picking a new target jump');
//         player.selectNewJump();
//     }

//     // update current progress with state fetches to account for changes
//     if (!player.jumped) {
//         current_progress += interval;
//         // setTimeout(step, Math.max(0, interval - dt));
//         setTimeout(step, interval); // take into account drift? (possible point of delay)
//     } else {
//         return;
//     };

// };
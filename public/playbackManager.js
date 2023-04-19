let playlist_position = 0;
let playback_queue;
let queue_fetch_ms;
let current_song;
let next_song;
let current_progress = 0;

import Player from './player.js';
import Timer from './timer.js';
import { organizeQueue } from './reshuffler.js';

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

        const playlist = response.playlist;
        queue_fetch_ms = (Date.now() - response.timestamp) + response.fulfillment_time;

        current_song = response.current_song;
        console.log(current_song);


        playback_queue = playlist.tracks.items.map(item => item.track);

        playback_queue = playback_queue.filter(track => track.id !== current_song.id)

        playback_queue.unshift(current_song);

        organizeQueue(playback_queue).then((shuffled_queue) => {

            playback_queue = shuffled_queue;

            console.log(playback_queue);

            current_song = playback_queue[0];
            next_song = playback_queue[playlist_position + 1]; // playlist_position starts at 0

            console.log(playback_queue);

            restartPlaybackManager();
        });


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


    // calculate user's current progress in the song based on request delay

    // 206000
    // 3:13 + 0:12 = 3:25
    // expressed in ms is 205000 duration is one second off actual(?)
    current_progress = player.playback_state.progress_ms + total_setup_time;
    let target_date = Date.now() + (playback_queue[playlist_position].duration_ms - current_progress);

    console.log('progress_ms: ' + player.playback_state.progress_ms + 'ms');
    console.log(`setup took: ${total_setup_time}ms`);

    console.log(`current date: ${Date.now()}`);
    console.log(`target date: ${target_date}`);
    console.log(`remaining time: ${playback_queue[playlist_position].duration_ms - current_progress}ms`);
    console.log(`duration: ${playback_queue[playlist_position].duration_ms}ms`);

    const interval = 100;

    let timer = new Timer(() => {
        // code that is ran on every interval

        if ((current_progress >= player.jump_ms - interval) && (current_progress <= player.jump_ms + interval)) {
            // Time to jump to the next song
            player.skipToNext().then(() => {
                // TODO: jump doesnt work with new timer

                current_song = playback_queue[playlist_position + 1];
                console.log(`new current song: ${current_song.name}`);

                playlist_position++; // increase by one for next song in queue
                next_song = playback_queue[playlist_position + 1];
                console.log(`new next song: ${next_song.name}`);

                // reset timer and player to shut them up
                player = null;
                timer = null;

                // wait 3 second before restarting playback manager to allow for spotify to update
                setTimeout(restartPlaybackManager, 5000);

                return;

            }).catch(err => console.log(err));
        };

        if (current_progress > player.jump_ms) {
            // Missed the target jump, oopsie :P

        };
        current_progress += interval;

    }, interval,
        () => {
            // special handling to deal with unexpectedly large drift
            console.log('tokyo drift')
        });

    timer.start();

};
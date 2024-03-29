let playlist_position = 0;
let playback_queue;
let queue_fetch_ms;
let current_song;
let next_song;
let current_progress = 0;
let resyncTimer;

import Player from './utils/player.js'
import Timer from './utils/timer.js';
import Terminal from './utils/logger.js';
import { organizeQueue } from './utils/reshuffler.js';

let terminal = new Terminal();
let timer;
let player;

document.getElementById('stop-listener').disabled = true;

/*

TODO:
// seems to be jumping slightly early
// could be caused by the resyncs
1. add tempo and bpm to shuffler
2. pick a new date if it gets missed
3. change the algorithm 
5. optimize for speed (reduce timer interval?)
6. restrict scopes to only what is needed
6. cleanup time!
7. standardize var names
8. add comments
9. add stop button
10. profit
11. switch to timer.stop()

PROBLEMS:
2. after a jump is made the client side queue is only one song so if they restart the app it freaks out on a jump

*/

document.getElementById('start-listener').addEventListener('click', function () {

    // prevent this function from being called multiple times by multiple presses of the button
    this.disabled = true;
    document.getElementById('stop-listener').disabled = false;
    document.getElementById('player-header').innerText = `Listening for a Playlist...`;


    $.ajax({
        url: '/check-state',
        data: {
            'access_token': access_token,
        }
    }).done((response) => {

        // reveal the terminal
        document.getElementById('terminal').style.display = 'block';

        const playlist = response.playlist;
        queue_fetch_ms = (Date.now() - response.timestamp) + response.fulfillment_time;

        current_song = response.current_song;
        console.log(current_song);


        playback_queue = playlist.tracks.items.map(item => item.track);

        playback_queue = playback_queue.filter(track => track.id !== current_song.id)

        playback_queue.unshift(current_song);

        terminal.log(`Playlist fetched in ${queue_fetch_ms}ms`);

        organizeQueue(playback_queue).then((shuffled_queue) => {

            terminal.log('Queue shuffled successfully!');

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


    player = new Player(current_song, next_song, access_token);

    if (playlist_position === 0) { // only have to log this once per session
        terminal.log('Initialized terminal');
    }

    terminal.log('Fetching analysis data...');

    const dataTimers = await player.gatherData();

    const analysis_fetch_ms = dataTimers.analysis_fetch_ms;
    const state_fetch_ms = dataTimers.state_fetch_ms;
    terminal.log(`Analysis data fetched, beginning comparison...`)


    const loader_start = Date.now();
    player.setTimestamps();
    player.updateStage(playback_queue, playlist_position);
    const loader_end = Date.now();
    terminal.log(`Setup complete, listening for jumps!`)

    console.log(`analysis fetch time: ${analysis_fetch_ms}ms`);
    console.log(`state fetch time: ${state_fetch_ms}ms`);
    console.log(`queue fetch time: ${queue_fetch_ms}ms`);
    console.log(`loader time: ${loader_end - loader_start}ms`);

    const total_setup_time = analysis_fetch_ms + state_fetch_ms + queue_fetch_ms + (loader_end - loader_start);


    current_progress = player.playback_state.progress_ms + total_setup_time;
    let target_date = Date.now() + (playback_queue[playlist_position].duration_ms - current_progress);

    console.log('progress_ms: ' + player.playback_state.progress_ms + 'ms');
    console.log(`setup took: ${total_setup_time}ms`);

    console.log(`current date: ${Date.now()}`);
    console.log(`target date: ${target_date}`);
    console.log(`remaining time: ${playback_queue[playlist_position].duration_ms - current_progress}ms`);
    console.log(`duration: ${playback_queue[playlist_position].duration_ms}ms`);

    const interval = 100;

    timer = new Timer(() => {
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

                terminal.log(`Jumped to ${current_song.name} by ${current_song.artists[0].name}`);
                terminal.log('Restarting playback manager...');
                terminal.log('- - - - - - - - - - - - - - - - - - - - - -')

                // reset timer and player to shut them up
                player = null;
                timer = null;

                // wait 3 second before restarting playback manager to allow for spotify to update
                setTimeout(restartPlaybackManager, 3000);

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

    // every 15 seconds run the resync the player with the server
    resyncTimer = setInterval(() => {
        player.resync().then((res) => {
            const response_time = Date.now() - res.fetch_timestamp
            current_progress = res.playback_state.progress_ms + response_time + res.sync_time;

            console.log('resynced');
        }).catch(err => console.log(err));
    }
        , 15000);


};



document.getElementById('stop-listener').addEventListener('click', function () {
    this.disabled = true;
    document.getElementById('start-listener').disabled = false;

    clearInterval(resyncTimer);

    document.getElementById('player-header').innerText = `Logged in with Spotify`;
    document.getElementById('song-1-img').src = './assets/missingtrack.png';
    document.getElementById('song-2-img').src = './assets/missingtrack.png';

    timer.stop();
    player = null;

    document.getElementById('track-list').innerHTML = '';
    document.getElementById('jump-plan').style.display = 'none';

    terminal.log('Listener stopped - thanks for using Playlist Assist!');

});
const { performance } = require('perf_hooks');
const math = require('./math.js');


/**
@param {string} token - User access token for Spotify
@param {string} current_song_id - Spotify track id for the current song
@param {string} next_song_id - Spotify track id for the next song
@param {number} range - Optional parameter for specifying the range of audio segments to compare
@returns {Array} An array of possible jumps where every jump is represented as an array of two millisecond values
[ 245011.84, 7644.99 ] where the first value is the jump timestamp and the second value is the landing timestamp
*/

const compareTrackIds = async (token, current_song_id, next_song_id, range = 20) => {

    // returns Spotify's audio analysis for a given track id
    const current_song = await getTrackAnalysis(token, current_song_id);
    const next_song = await getTrackAnalysis(token, next_song_id);

    // slice segment arrays to only include a given range of segments
    const current_song_segments = current_song.segments.slice((range * -1));
    const next_song_segments = next_song.segments.slice(0, range);

    // compare segments and return possible jumps
    const possible_jumps = compareSongSegments(current_song_segments, next_song_segments);
    console.log(possible_jumps)
    return possible_jumps;

};


/**
@param {string} token - User access token for Spotify
@param {string} track_id - Spotify track id for a single song
@returns {Object} Spotify's audio analysis for a given track id
*/

const getTrackAnalysis = async (token, track_id) => {

    const result = await fetch(`https://api.spotify.com/v1/audio-analysis/${track_id}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .catch(e => console.error(e));

    const data = await result.json();
    return data
}



const getPitch = (arr) => {
    let pitches = [];
    let result = [];
    arr.forEach((x) => {
        if (x > 0.75) {
            pitches.push(x);
        }
    });
    pitches.forEach((x) => {
        result.push(arr.indexOf(x))
    });
    return result;
};


// add confidence rating so algo can make the best decision
const analyzeSegment = (seg1, seg2) => {
    const euclidean_distance = math.euclideanDistance(seg1['timbre'], seg2['timbre'])
    const dominant_pitches = [getPitch(seg1['pitches']), getPitch(seg2['pitches'])];
    let shared_pitches = [];

    dominant_pitches[0].forEach((x) => {
        if (dominant_pitches[1].includes(x)) {
            shared_pitches.push(x);
        };
    });
    return [euclidean_distance, shared_pitches];
};

// input array of segment objects - return array of indexes for possible jumps
const compareSongSegments = (arr1, arr2) => {
    let start_time = performance.now()
    let jumpable_segments = [];
    for (let i = 0; i < arr1.length; i++) {
        for (let k = 0; k < arr2.length; k++) {
            let comparison = analyzeSegment(arr1[i], arr2[k]);
            if (!comparison[1]) { // remove segs that have no matching dominant pitches
                continue;
            } else if (comparison[0] > 100) { // remove segs that are further than 100 apart
                continue;
            } else {
                const jump_ms = (arr1[i].start * 1000);
                const landing_ms = (arr2[k].start * 1000);
                jumpable_segments.push([jump_ms, landing_ms]); // add segments that meet criteria to possible jumps
                continue;
            };
        };
    };
    let end_time = performance.now()
    console.log(`${jumpable_segments.length} possible jumps found in ${end_time - start_time} milliseconds`);
    return jumpable_segments;

};




module.exports = { compareTrackIds };
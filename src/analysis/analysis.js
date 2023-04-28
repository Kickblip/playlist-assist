const { performance } = require('perf_hooks');
const math = require('./math.js');


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


const analyzeTracks = async (token, current_song_id, next_song_id, range = 20) => {

    // returns Spotify's audio analysis for a given track id
    const current_song_analysis = await getTrackAnalysis(token, current_song_id);
    const next_song_analysis = await getTrackAnalysis(token, next_song_id);

    // compare segments and return possible jumps
    const possible_jumps = compareTracks(current_song_analysis, next_song_analysis, range);
    console.log(possible_jumps)
    return possible_jumps;

};


const compareTracks = (current_song_analysis, next_song_analysis, range) => {

    let start_time = performance.now()

    // slice segment arrays to only include a given range of segments
    const current_song_segments = current_song_analysis.segments.slice((range * -1));
    const next_song_segments = next_song_analysis.segments.slice(0, range);


    let possible_jumps = [];
    for (let i = 0; i < current_song_segments.length; i++) {
        for (let j = 0; j < next_song_segments.length; j++) {
            const vector1 = [current_song_segments[i].loudness_start, current_song_segments[i].loudness_max, current_song_segments[i].loudness_max_time, current_song_segments[i].loudness_end];
            const vector2 = [next_song_segments[j].loudness_start, next_song_segments[j].loudness_max, next_song_segments[j].loudness_max_time, next_song_segments[j].loudness_end];

            const similarity = math.euclideanDistance(vector1, vector2);

            if (similarity < 0.5) {
                const jump_ms = (current_song_segments[i].start * 1000);
                const landing_ms = (next_song_segments[j].start * 1000);
                possible_jumps.push([jump_ms, landing_ms]); // add segments that meet criteria to possible jumps
            };
        };

    };

    let end_time = performance.now()
    console.log(`${possible_jumps.length} possible jumps found in ${end_time - start_time} milliseconds`);
    return possible_jumps;
};

const measureLoudness = (segment) => {

};




module.exports = { analyzeTracks };
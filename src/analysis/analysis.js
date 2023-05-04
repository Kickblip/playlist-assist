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
    const current_song_segments = current_song_analysis.segments.slice((range * -1) - 5, -5);
    const next_song_segments = next_song_analysis.segments.slice(0, range);

    // add the similarity of each possible jump then sort by similarity
    // only save the jumps with the highest similarity
    // prevents 0-jump errors

    let jumps = [];
    for (let i = 0; i < current_song_segments.length; i++) {
        for (let j = 0; j < next_song_segments.length; j++) {

            const current_segment = current_song_segments[i];
            const next_segment = next_song_segments[j];

            // create vectors from loudness values
            const vector1 = [current_segment.loudness_start, current_segment.loudness_max, current_segment.loudness_max_time, current_segment.loudness_end];
            const vector2 = [next_segment.loudness_start, next_segment.loudness_max, next_segment.loudness_max_time, next_segment.loudness_end];

            // calculate the distance between the two vectors
            const loudness_distance = math.euclideanDistance(vector1, vector2);




            jumps.push([current_segment, next_segment, loudness_distance]); // add segments that meet criteria to possible jumps
        };
    };

    // sort the jumps array by similarity
    jumps.sort((a, b) => {
        return b[2] - a[2];
    });







    // return the top 15 jumps (array sorted from big to small distance)
    let possible_jumps = jumps.slice(-15);

    // reverse the array so that the jumps are sorted from smallest to largest distance
    possible_jumps.reverse();

    // go through the possible jumps and remove the distance value from each jump
    // then replace the jump/landing with the start and end times in milliseconds
    possible_jumps = possible_jumps.map(jump => {
        const jump_ms = jump[0].start * 1000;
        const landing_ms = jump[1].start * 1000;
        return [jump_ms, landing_ms];
    });

    let end_time = performance.now()
    console.log(`${possible_jumps.length} possible jumps found in ${end_time - start_time} milliseconds`);



    return possible_jumps;
};


module.exports = { analyzeTracks };
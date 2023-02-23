const { performance } = require('perf_hooks');

const getTrackAnalysis = async (token, trackId) => {

    const result = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data
}

const _getEuclideanDistance = (arr1, arr2) => {
    let result = 0;
    for (let i = 0; i < arr1.length; i++) {
        result += (arr1[i] - arr2[i]) ** 2;
    };
    return Math.sqrt(result);
};

const _getPitch = (arr) => {
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
const _analyzeSegment = (seg1, seg2) => {
    const euclideanDistance = _getEuclideanDistance(seg1['timbre'], seg2['timbre'])
    const dominantPitches = [_getPitch(seg1['pitches']), _getPitch(seg2['pitches'])];
    let sharedPitches = [];

    dominantPitches[0].forEach((x) => {
        if (dominantPitches[1].includes(x)) {
            sharedPitches.push(x);
        };
    });
    return [euclideanDistance, sharedPitches];
};

// input array of segment objects - return array of indexes for possible jumps
const compareSongSegments = (arr1, arr2) => {
    let startTime = performance.now()
    let jumpableSegments = [];
    for (let i = 0; i < arr1.length; i++) {
        for (let k = 0; k < arr2.length; k++) {
            let comparison = _analyzeSegment(arr1[i], arr2[k]);
            if (!comparison[1]) { // remove segs that have no matching dominant pitches
                continue;
            } else if (comparison[0] > 100) { // remove segs that are further than 100 apart
                continue;
            } else {
                const jump_ms = (arr1[i].start * 1000);
                const landing_ms = (arr2[k].start * 1000);
                jumpableSegments.push([jump_ms, landing_ms]); // add segments that meet criteria to possible jumps
                continue;
            };
        };
    };
    let endTime = performance.now()
    console.log(`${jumpableSegments.length} possible jumps found in ${endTime - startTime} milliseconds`);
    return jumpableSegments;

};

const compareTrackIds = async (token, current_song_id, next_song_id, range = 20) => {

    // returns Spotify's audio analysis for a given track id
    const current_song = await getTrackAnalysis(token, current_song_id);
    const next_song = await getTrackAnalysis(token, next_song_id);

    // slice segment arrays to only include a given range of segments
    const current_song_segments = current_song.segments.slice((range * -1));
    const next_song_segments = next_song.segments.slice(0, range);

    // compare segments and return possible jumps
    const possibleJumps = compareSongSegments(current_song_segments, next_song_segments);
    return possibleJumps;

};




module.exports = { getTrackAnalysis, compareSongSegments, compareTrackIds };
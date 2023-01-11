
// function updateStage (currently_playing, next_track) {

//     const missing_url = 'https://buckleyhc.com/wp-content/uploads/2013/11/Vector-person-leaning-back-on-big-red-question-mark.jpg';

//     if (document.getElementById('song-1-img').src === missing_url) {
//         document.getElementById('song-1-img').src = `${currently_playing.album.images[1].url}`
//         songStage[0] = track.id
//     } else {
//         document.getElementById('song-2-img').src = `${next_track.album.images[1].url}`
//         songStage[1] = track.id
//     }

// };

function updateStage(currently_playing, next_track) {

    document.getElementById('song-1-img').src = `${currently_playing.album.images[1].url}`
    document.getElementById('song-2-img').src = `${next_track.album.images[1].url}`

};

module.exports = { updateStage };
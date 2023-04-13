const getQueue = async (token) => {

    const result = await fetch(`https://api.spotify.com/v1/me/player/queue`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data

}

const getPlaybackState = async (token) => {

    // state is returned NOT as a json
    const result = await fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });


    if (result.status === 200) {
        console.log('valid state found - locking playback')
        return result;
    } else {
        console.log(`getPlaybackState failed with error ${result.status}`);
        return result;
    };
};

const getCurrentPlaylist = async (token, playlistId) => {

    const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .catch(e => console.error(e));

    const data = await result.json();
    return data;

};


module.exports = { getPlaybackState, getQueue, getCurrentPlaylist };
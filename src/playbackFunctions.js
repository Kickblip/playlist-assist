const getQueue = async (token) => {

    const result = await fetch(`https://api.spotify.com/v1/me/player/queue`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data

}

const getPlaybackState = async (token) => {

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


module.exports = { getPlaybackState, getQueue };
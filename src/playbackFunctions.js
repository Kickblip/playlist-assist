const _getQueue = async (token) => {

    const result = await fetch(`https://api.spotify.com/v1/me/player/queue`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data

}

const _getPlaybackState = async (token) => {

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

const skipToNextTrack = async (token, target_device, track_id, offset_ms) => {

    fetch(`https://api.spotify.com/v1/me/player/play${target_device && `?device_id=${target_device}`}`, {
        method: "PUT",
        body: JSON.stringify({ "uris": [`spotify:track:${track_id}`] }),
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).catch(e => console.error(e));

    console.log(`skipped to ${track_id} on ${target_device}`);

};


module.exports = { skipToNextTrack, _getPlaybackState, _getQueue };
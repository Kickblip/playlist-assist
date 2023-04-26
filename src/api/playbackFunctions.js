const fetchWithErrorHandling = async (url, options) => {
    try {
        const response = await fetch(url, options);

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { response, data: null };
        }

        const data = await response.json();
        return { response, data };
    } catch (error) {
        console.error(error);
        return { response: null, data: null };
    }
};


const getQueue = async (token) => {
    const { data } = await fetchWithErrorHandling(`https://api.spotify.com/v1/me/player/queue`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    return data;
};

const getPlaybackState = async (token) => {
    const { response, data } = await fetchWithErrorHandling(`https://api.spotify.com/v1/me/player`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    if (response && response.status === 200) {
        console.log('valid state found - locking playback');
    } else {
        console.log(`getPlaybackState failed with error ${response.status}`);
    }

    return { response, data };
};


const getCurrentPlaylist = async (token, playlistId) => {
    const { data } = await fetchWithErrorHandling(`https://api.spotify.com/v1/playlists/${playlistId}/`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    return data;
};


module.exports = { getPlaybackState, getQueue, getCurrentPlaylist };
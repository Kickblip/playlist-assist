const express = require('express');
const querystring = require('querystring');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const playbackFunctions = require('./src/playbackFunctions');
const analysis = require('./src/analysis');
const firebase_app = require('firebase/app');
const databaseManager = require('./src/database');

require('dotenv').config();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID
};

// Initialize Firebase
const firebaseApp = firebase_app.initializeApp(firebaseConfig);


const generateRandomString = function (length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};


let stateKey = 'spotify_auth_state'; // name of the cookie

let app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.get('/login', function (req, res) {

    let state = generateRandomString(16);
    res.cookie(stateKey, state); // set cookie to travel with request

    // request authorization - automatically redirects to callback
    const scope = 'user-read-private user-read-email user-read-currently-playing user-modify-playback-state user-read-playback-state streaming';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function (req, res) {

    // request refresh and access tokens after comparing states

    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);

        const authOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            body: `code=${code}&redirect_uri=${redirect_uri}&grant_type=authorization_code`,
            json: true
        };

        fetch('https://accounts.spotify.com/api/token', authOptions)
            .then((response) => {
                if (response.status === 200) {
                    response.json().then((data) => {
                        let access_token = data.access_token
                        let refresh_token = data.refresh_token

                        // login to firebase app - create node on database tree
                        databaseManager.login(firebaseApp)

                        res.redirect('/#' +
                            querystring.stringify({
                                access_token: access_token,
                                refresh_token: refresh_token,
                            }));

                    });
                } else {
                    res.redirect('/#' +
                        querystring.stringify({
                            error: 'invalid_token'
                        }));
                };
            })
            .catch(error => {
                console.error(error);
            });
    }
});

app.get('/refresh_token', function (req, res) {

    // requesting access token from refresh token

    const refresh_token = req.query.refresh_token;
    const authOptions = {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
    };

    fetch('https://accounts.spotify.com/api/token', authOptions)
        .then(response => {
            if (response.status === 200) {
                response.json().then((data) => {
                    const access_token = data.access_token;
                    res.send({ access_token });
                });
            };
        })
        .catch(error => {
            console.error(error);
            res.send(error);
        });
});

app.get('/check-state', function (req, res) {

    const access_token = req.query.access_token;

    setTimeout(checkPlaybackState, 1000);
    function checkPlaybackState() {
        playbackFunctions.getPlaybackState(access_token).then((response) => {
            if (response.status === 200) {

                const request_start_time = Date.now();

                playbackFunctions.getQueue(access_token).then((playback_queue) => {

                    const time_taken = Date.now() - request_start_time;
                    const response_timestamp = Date.now();

                    res.send({
                        'playback_queue': playback_queue,
                        'fulfillment_time': time_taken,
                        'timestamp': response_timestamp
                    });

                });

            } else {
                setTimeout(checkPlaybackState, 3000);
            };
        });
    };
});

app.get('/get-analysis', function (req, res) {

    const request_start_time = Date.now();

    const access_token = req.query.access_token;
    const current_song_id = req.query.current_song_id;
    const next_song_id = req.query.next_song_id;

    analysis.compareTrackIds(access_token, current_song_id, next_song_id, 20).then((analysis_array) => {
        const response_timestamp = Date.now()
        const time_taken = Date.now() - request_start_time;

        res.send({
            'analysis_array': analysis_array,
            'timestamp': response_timestamp,
            'fulfillment_time': time_taken
        });
    });
});

app.get('/get-state', function (req, res) {

    const request_start_time = Date.now();

    const access_token = req.query.access_token;

    playbackFunctions.getPlaybackState(access_token).then((response) => {
        if (response.status === 200) {
            response.json().then((playback_state) => {

                const response_timestamp = Date.now()
                const time_taken = Date.now() - request_start_time;

                res.send({
                    'playback_state': playback_state,
                    'timestamp': response_timestamp,
                    'fulfillment_time': time_taken
                });
            })
        };
    }).catch((error) => {
        res.send({
            'error_code': error
        });
    });

});

app.get('/get-queue', function (req, res) {

    const request_start_time = Date.now();

    const access_token = req.query.access_token;

    playbackFunctions.getQueue(access_token).then((playback_queue) => {

        const response_timestamp = Date.now();
        const time_taken = Date.now() - request_start_time;

        res.send({
            'playback_queue': playback_queue,
            'timestamp': response_timestamp,
            'fulfillment_time': time_taken
        });

    });
});

console.log('Listening on 8888');
app.listen(8888);
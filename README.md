# Playlist Assist Playlist Manager
create seamless, beat-matched transitions for Spotify using audio analysis from their API

## [View the Demo](https://youtube.com/shorts/At7JKpYVbnc?feature=share) (Skip to 0:55 for Transition)

[![tiktok demo](https://img.youtube.com/vi/At7JKpYVbnc/0.jpg)](https://www.youtube.com/watch?v=At7JKpYVbnc)

## Running Playlist-Assist

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new API project following [this video](https://youtu.be/NPW4K3aMjI8?si=9yfPyx4ov1nZ1r0U&t=191)

2. Clone this repo to a local directory

3. Create a ```.env``` file in the root directory

4. Set the following environment variables:

```
CLIENT_ID = Your ID from the API dashboard
CLIENT_SECRET = Your secret from the API dashboard
REDIRECT_URI = http://localhost:8888/callback
```

5. Run the command ```npm install``` then ```node src/app.js```

6. Open [http://localhost:8888](http://localhost:8888) to view in your browser

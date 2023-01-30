# Knit-list Playlist Manager
spotify companion webapp for creating seamless, beat-matched transitions based on audio analysis

## What data is the algorithm using?
* Spotify Audio Feature Data
  * acousticness
  * danceability
  * energy
  * instrumentalness
  * liveness
  * speechiness
  * valence
* Track Property Data
  * loudness
  * key
  * mode
  * tempo
  * time signature
* Segmented Data (1 'segment' of audio = ~0.25s)
  * Timbre
  * Pitch
  * Position within beat
  * Position within bar

## Running Knit-list on localhost

1. Replace ```process.env``` variables with your own firebase config + spotify app credentials

2. Use commands ```npm install``` and ```node app.js``` in terminal

3. Open [http://localhost:8000](http://localhost:8000) to view in your browser

## Gallery

<div style="display:flex;justify-content:space-between;align-items:center;">
  <div style="text-align:center;">
    <img src="https://cdn.discordapp.com/attachments/1023710494416195686/1067660979917307934/Screen_Shot_2022-12-21_at_1.58.22_PM.png" style="width:45%;height:auto;">
    <p style="margin-top:10px;">12/21/22 - My first audio analysis (bottom-left array is all possible jumps between songs)</p>
  </div>
  <div style="text-align:center;">
    <img src="https://cdn.discordapp.com/attachments/1023710494416195686/1065670484005486632/Screen_Shot_2023-01-19_at_10.33.26_AM.png" style="width:45%;height:auto;">
    <p style="margin-top:10px;">1/19/23 - Updated UI</p>
  </div>
</div>

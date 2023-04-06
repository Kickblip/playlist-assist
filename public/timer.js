export default function Timer(callback, timeInterval, targetDate, errorCallback, jumpCallback, missedCallback) {
    this.timeInterval = timeInterval;
    // Start timer
    this.start = () => {
        // Set the expected time
        this.expected = Date.now() + this.timeInterval;
        this.timeout = setTimeout(this.round, this.timeInterval);
        console.log('Started timer');
    }
    // Stop timer
    this.stop = () => {
        clearTimeout(this.timeout);
        console.log('Stopped timer');
    }
    // Method that takes care of running our callback and adjusting the time interval
    this.round = () => {
        let drift = Date.now() - this.expected; // the drift (positive for overshooting)
        if (drift > this.timeInterval) {
            // Something really bad happened. Maybe the browser (tab) was inactive?
            if (errorCallback) errorCallback();
        };

        if (this.expected >= targetDate - this.timeInterval && this.expected <= targetDate + this.timeInterval) {
            // Time to jump to the next song
            if (jumpCallback) jumpCallback();
        };

        if (this.expected > targetDate) {
            // Missed the target date
            if (missedCallback) missedCallback();
        };

        callback();
        this.expected += this.timeInterval;
        // console.log(this.expected); // current unix epoch timestamp
        this.timeout = setTimeout(this.round, this.timeInterval - drift); // take into account drift
    }
}
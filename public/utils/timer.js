export default function Timer(callback, timeInterval, errorCallback) {
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
        callback();
        this.expected += this.timeInterval;
        this.timeout = setTimeout(this.round, this.timeInterval - drift); // take into account drift
    }
}
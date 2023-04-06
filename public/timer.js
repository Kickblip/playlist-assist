export default function Timer(callback, timeInterval) {
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
        callback();
        this.expected += this.timeInterval;
        console.log(drift);
        this.timeout = setTimeout(this.round, this.timeInterval - drift); // take into account drift
    }
}
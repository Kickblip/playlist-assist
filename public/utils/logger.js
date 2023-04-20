export default class Terminal {
    constructor() {

    }
    // logs a message to the terminal
    log(message) {
        const terminal = document.getElementById('terminal');
        terminal.innerHTML += `${message}<br>`;

        terminal.scrollTop = terminal.scrollHeight;
    }
}
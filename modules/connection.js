// connection.js
// =======================================
// an abstraction class for channels

class connection {

    output = {
        error: false,
        payload: null,
        stderr: null
    }

    constructor () {
        this.output.payload = "Hello from the connection class!";
    }

    return() {
        console.log(this.output);
    }
    
}

export default connection;

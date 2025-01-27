// connection.js
// =======================================
// an abstraction class for channels

class connection {

    output = {
        error: false,
        payload: null,
        log: null
    }

    log(message) {
        if (this.output.log === null) {
            this.output.log = [];
        }
        this.output.log.push(message);
    }

    error(message) {
        this.output.error = true;
        this.log(message)
        this.return();
        this.kill();
    }

    setPayload(payload) {
        this.output.payload = payload;
    }

    return() {
        console.log(JSON.stringify(this.output));
    }
    
}

export default connection;

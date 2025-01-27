// autoload.js
// =======================================
// discovers and loads channels on the fly

import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exec } from 'node:child_process';

class autoload {
    path;
    list = [];

    constructor(path) {
        this.path = path;
    }

    discover() {
        let currentList = [];
        fs.readdir(this.path)
            .then(files => {
                // Map file names to promises
                const readPromises = files.map(file =>
                    fs.readFile(`${this.path}/${file}/config.json`)
                        .then(data => {
                            currentList.push(file);
                            let checksum = createHash('sha1').update(data).digest('base64');
                            let item = {
                                name: file,
                                controlId: null,
                                checksum: checksum,
                                config: JSON.parse(data)
                            };
    
                            // Check if channel already exists in this.list
                            let exists = false;
                            for (let i = 0; i < this.list.length; i++) {
                                if (this.list[i].name === file) {
                                    exists = true;
                                    if (this.list[i].checksum !== checksum) {
                                        console.log(`Updated ${item.config.name ?? file}`);
                                        this.list[i] = item;
                                    }
                                }
                            }
    
                            if (!exists) {
                                // Create the process
                                item.controlId = this.register(item);
                                console.log(`Loaded ${item.config.name ?? file}`);
                                this.list.push(item);
                            }
                        })
                        .catch(error => {
                            // console.error(`Error reading file ${file}/config.json`, error);
                        })
                );
    
                // Wait for all read promises to complete
                return Promise.all(readPromises);
            })
            .then(() => {
                // Remove any items from this.list that do not appear in currentList
                this.list = this.list.filter(item => {
                    if (!currentList.includes(item.name)) {
                        console.log(`Unloaded ${item.config.name ?? item.name}`);
                        return false;
                    }
                    return true;
                });
            })
            .catch(error => {
                console.error(error);
            });
    }

    register (item) {
        var id = null;

        switch (item.config.type) {
            case 'polling':
                let interval = item.config.polling.interval;
                let entry    = this.path + '/' + item.name + '/' + item.config.entrypoint;
                id = setInterval(() => {
                        exec(`node ${entry}`, (error, stdout, stderr) => {
                            if (error) {
                                console.error(stderr);
                                return;
                            }

                            stdout = JSON.parse(stdout);
                            
                            if (stdout.log) {
                                stdout.log.forEach(log => {
                                    console.log(log);
                                });
                            }
                        });
                    }, interval);
                break;
            default:
                console.error(`Error while registering channel ${item.config.name ?? item.name}\n\t${item.config.type} is not a valid channel type`);
        }

        return id;
    }
}

export default autoload;

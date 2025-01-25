// autoload.js
// =======================================
// discovers and loads channels on the fly

import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

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
}

export default autoload;

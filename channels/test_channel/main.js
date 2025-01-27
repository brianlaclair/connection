import connection from '../../modules/connection.js';
import hl7 from '../../modules/serializers/hl7_2x.js';
import path from 'node:path';
import fs from 'node:fs';

var conn = new connection();

// Look for files in this directory of the type .hl7
var look_path = './test_messages/';
var files = fs.readdirSync(look_path);
const hl7Files = files.filter(file => path.extname(file).toLowerCase() === '.hl7');

hl7Files.forEach(file => {
    conn.log(`Processing ${file}`);
    var data = fs.readFileSync(look_path + file, 'utf8');
    var msg = new hl7(data);
    
    var content = [msg.getValue("MSH.10.1"), msg.getValue("PID.5.2"), msg.getValue("PID.5.1"), msg.getValue("MSH.6.1")].join(",");

    var name = look_path + file.replace('.hl7', '.csv');
    var csv = fs.writeFileSync(look_path + file.replace('.hl7', '.csv'), content);
    conn.log(`Created CSV file at ${name}`);

    // Delete original file
    fs.unlinkSync(look_path + file);
    conn.log(`Deleted original file at ${look_path + file}`);
});

conn.return();
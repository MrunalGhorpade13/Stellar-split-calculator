import fs from 'fs';
import https from 'https';

const url = "https://github.com/stellar/stellar-cli/releases/download/v22.0.0/stellar-cli-22.0.0-x86_64-pc-windows-msvc.exe";
const dest = process.argv[2];

console.log(`Downloading ${url} to ${dest}...`);

https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Following redirect to ${res.headers.location}...`);
        https.get(res.headers.location, (res2) => {
            const file = fs.createWriteStream(dest);
            res2.pipe(file);
            file.on('finish', () => {
                file.close(() => console.log("Download completed!"));
            });
        }).on('error', (err) => console.error("Error on redirect:", err));
    } else {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
            file.close(() => console.log("Download completed directly!"));
        });
    }
}).on('error', (err) => console.error("Error:", err));

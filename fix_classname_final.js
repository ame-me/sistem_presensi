const fs = require('fs');
const path = require('path');

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                        results.push(file);
                    }
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

walk('c:\\xampp\\htdocs\\presensipander\\src', function (err, files) {
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content.replace(/\brombelName\b/g, 'className');
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
        }
    });

    console.log("Reverted rombelName to className across all files.");
});

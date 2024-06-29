const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const routes = require('./routes/index');
const cors = require('cors');
const fs = require('fs');
const subpageRouter1 = require('./routes/warcaby'); // Import the subpage router
// const subpageRouter2 = require('./routes/mechanics');
// const subpageRouter3 = require('./routes/games');

const app = express();

app.use(cors()); // Prevents CORS error

app.get('/api', function(req, res) {
    if (req.url === '/favicon.ico') {
        res.end();
    }
    // Ends request for favicon without counting

    const json = fs.readFileSync('count.json', 'utf-8');
    const obj = JSON.parse(json);
    // Reads count.json and converts to JS object

    obj.pageviews = obj.pageviews + 1;
    if (req.query.type === 'visit-pageview') {
        obj.visits = obj.visits + 1;
    }
    // Updates pageviews and visits (conditional upon URL param value)

    const newJSON = JSON.stringify(obj);
    // Converts result to JSON

    fs.writeFileSync('count.json', newJSON);
    res.send(newJSON);
    // Writes result to file and sends to user as JSON
})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
});
app.use('/public', express.static(path.join(__dirname, 'public'), { 'Content-Type': 'text/javascript' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(flash());

app.use('/', routes); // Use the main router

// Middleware to check referer for /warcaby and handle refresh
app.use('/warcaby', (req, res, next) => {
    const referer = req.get('referer');
    if (!referer || !referer.includes('/')) {
        return res.redirect('/');
    }
    next();
});

app.use('/warcaby', subpageRouter1);
// app.use('/mechanics', subpageRouter2);
// app.use('/games', subpageRouter3);

app.get('/warcaby', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'warcaby.html'));
});

module.exports = app;

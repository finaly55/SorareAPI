const express = require('express');
const app = express();

//Middleware
// tu t'en fou
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Routes 
const sorare = require('./routes/sorare')
app.use('/sorare', sorare);

const port = 8080;

app.listen(port, () => console.log(`Server started on http://localhost:${port}`));

module.exports = { app }
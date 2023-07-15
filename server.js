const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

// Importer les routes
const sorare = require('./routes/sorare')

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Routes 
app.use('/sorare', sorare);

// Gérer les erreurs
app.use((req, res, next) => {
    const error = new Error('Erreur');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
res.status(error.status || 500);
res.json({
        error: {
            message: error.message
        }
    });
});

const args = process.argv.slice(2);
const portArgIndex = args.indexOf('--port');
const port = portArgIndex !== -1 && args[portArgIndex + 1] ? parseInt(args[portArgIndex + 1], 10) : 8080;

app.listen(port, () => console.log(`Server started on http://localhost:${port}`));

module.exports = { app }
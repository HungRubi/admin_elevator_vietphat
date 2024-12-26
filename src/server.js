const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const db = require('./config/db/index');
const route = require('./resources/router/index.route');
const methodOverride = require('method-override');
const cors = require('cors');

const port = 4000;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.engine(
    '.hbs',
    handlebars.engine({
        extname: '.hbs',
        helpers: {
            sum: (a, b) => a + b,
            eq: (a, b) => a === b,
        },
        
    }),
);

app.use(methodOverride('_method'));

app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'resources', 'views'));

app.use(
    express.urlencoded({
        extended: true,
    }),
);

app.use(cors());
db.connect();
route(app);

app.listen(port, () => {
    console.log(`App is running at localhost:${port}`);
});
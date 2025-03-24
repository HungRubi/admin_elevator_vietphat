const express = require('express');
const db = require('./config/db/index');
const route = require('./resources/router/index.route');
const methodOverride = require('method-override');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser')
const port = 4000;
const app = express();

app.use(cookieParser());

app.use(
    express.urlencoded({
        extended: true,
    }),
);
app.use(express.json());
/** method overide */
app.use(methodOverride('_method'));

app.use(passport.initialize());

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    credentials: true
}));
db.connect();
route(app);

app.listen(port, () => {
    console.log(`App is running at localhost:${port}`);
});
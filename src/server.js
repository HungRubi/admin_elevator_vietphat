const express = require('express');
const db = require('./config/db/index');
const route = require('./resources/router/index.route');
const methodOverride = require('method-override');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 4000;
const app = express();
const dotenv = require("dotenv");
const path = require("path")

app.use(cookieParser());

app.use(
    express.urlencoded({
        extended: true,
    }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadPath));
/** method overide */
app.use(methodOverride('_method'));

app.use(passport.initialize());

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://vmu.com.vn"],
    credentials: true
}));
db.connect();
route(app);

app.listen(port, () => {
    console.log(`App is running at localhost:${port}`);
});
const siteRoute = require('./site.route');
const productRoute = require('./products.route');
const orderRoute = require('./orders.route');
const userRoute = require('./user.route');
const articleRoute = require('./article.route');
const reportRoute = require('./report.route');
const loginRoute = require('./login.route');
const categoryRoute = require('./category.route');
const apiRoute = require('./api.route');

function route(app) {
    app.use('/api', apiRoute);
    app.use('/category', categoryRoute);
    app.use('/login', loginRoute);
    app.use('/report', reportRoute);
    app.use('/products', productRoute);
    app.use('/articles', articleRoute);
    app.use('/users', userRoute);
    app.use('/orders', orderRoute);
    app.use('/', siteRoute);
}

module.exports = route;
const siteRoute = require('./site.route');
const productRoute = require('./products.route');
const orderRoute = require('./orders.route');
const userRoute = require('./user.route');
const articleRoute = require('./article.route');
const reportRoute = require('./report.route');
const categoryRoute = require('./category.route');
const authRoute = require('./auth.route');
const notificaitonRoute = require('./notification.route')
const cartRoute = require('./cart.route')

function route(app) {
    app.use('/cart', cartRoute);
    app.use('/auth', authRoute);
    app.use('/notificaiton', notificaitonRoute);
    app.use('/category', categoryRoute);
    app.use('/report' ,reportRoute);
    app.use('/products', productRoute);
    app.use('/articles', articleRoute);
    app.use('/user', userRoute);
    app.use('/order', orderRoute);
    app.use('/', siteRoute);
}

module.exports = route;
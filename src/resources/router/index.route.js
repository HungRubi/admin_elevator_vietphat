const siteRoute = require('./site.route');
const productRoute = require('./products.route');
const orderRoute = require('./orders.route');
const userRoute = require('./user.route');
const articleRoute = require('./article.route');
const reportRoute = require('./report.route');
const categoryRoute = require('./category.route');
const authRoute = require('./auth.route');
const notificationRoute = require('./notification.route');
const cartRoute = require('./cart.route');
const commentRoute = require('./comments.route');
const supplierRoute = require('./supplier.route');
const receiptRoute = require('./receipt.route');
const warehouseRoute = require('./warehouse.route');
const warrantyRoute = require('./warranty.route');

function route(app) {
    app.use('/warranty', warrantyRoute);
    app.use('/receipt', receiptRoute);
    app.use('/warehouse', warehouseRoute);
    app.use('/supplier', supplierRoute);
    app.use('/comment', commentRoute);
    app.use('/cart', cartRoute);
    app.use('/auth', authRoute);
    app.use('/notification', notificationRoute);
    app.use('/category', categoryRoute);
    app.use('/report' ,reportRoute);
    app.use('/products', productRoute);
    app.use('/articles', articleRoute);
    app.use('/user', userRoute);
    app.use('/order', orderRoute);
    app.use('/', siteRoute);
}

module.exports = route;
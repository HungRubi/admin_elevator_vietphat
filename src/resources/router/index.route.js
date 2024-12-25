const siteRoute = require('./site.route');
const productRoute = require('./products.route');
const orderRoute = require('./orders.route');
const employeeRoute = require('./employee.route');
const custumersRoute = require('./custumers.route');

function route(app) {
    app.use('/products', productRoute);
    app.use('/employee', employeeRoute);
    app.use('/custumers', custumersRoute);
    app.use('/orders', orderRoute);
    app.use('/', siteRoute);
}

module.exports = route;
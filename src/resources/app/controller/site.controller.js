class SiteController{
    index(req, res, index) {
        res.render('site');
    }
}
module.exports = new SiteController();
class SiteController{
    index(req, res, index) {
        if (req.isAuthenticated()) {
            return res.render('site');
        }
        res.redirect('/login');
    }
}
module.exports = new SiteController();
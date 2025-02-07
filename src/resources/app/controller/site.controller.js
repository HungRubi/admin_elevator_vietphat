class SiteController{
    index(req, res, index) {
        if (req.session.user) {
            res.render('site');
        } else {
            res.redirect('/login');
        }
        // res.render('site')
    }
}
module.exports = new SiteController();
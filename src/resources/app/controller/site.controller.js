class SiteController{
    index(req, res, index) {
        if (req.session.employee) {
            res.render('site');
        } else {
            res.redirect('/login');
        }
    }
}
module.exports = new SiteController();
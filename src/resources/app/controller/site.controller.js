class SiteController{
    index(req, res, index) {
        if (req.session.custumer) {
            res.render('site', { account: req.session.custumer.account });
        } else {
            res.redirect('/login');
        }
    }
}
module.exports = new SiteController();
class ReportController {
    index(req, res, next) {
        if (req.session.employee) {
            res.render('report/report', { account: req.session.employee.account });
        } else {
            res.redirect('/login');
        }
    }
}

module.exports = new ReportController();
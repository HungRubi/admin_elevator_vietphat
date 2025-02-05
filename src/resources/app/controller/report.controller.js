class ReportController {
    index(req, res, next) {
        res.render('report/report');
    }
}

module.exports = new ReportController();
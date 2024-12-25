class EmployeeController {
    
    index(req, res, next) {
        res.render('employee/employee');
    }
 
}

module.exports = new EmployeeController();
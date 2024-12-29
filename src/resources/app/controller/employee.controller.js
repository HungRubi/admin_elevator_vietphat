const Employee = require('../model/employee.model');


class EmployeeController {
    
    /** [GET] /employee */
    index(req, res, next) {
        res.render('employee/employee');
    }
 
    /** [GET] /employee/add */
    add(req, res, next){
        res.render('employee/addEmployee');
    }

    /** [POST] /employee/store */
    store = async(req, res, next) => {
        try{
            const employee = req.body;
            employee = new Employee();
            await employee.save();
            res.redirect('/employee');
        }catch(error){
            next(error);
        }
    }
}

module.exports = new EmployeeController();
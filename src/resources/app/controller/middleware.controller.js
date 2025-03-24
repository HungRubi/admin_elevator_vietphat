const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const MiddlewareController = {
    verifyToken(req, res, next) {
        const token = req.headers.authorization || req.headers.token;
        if(token){
            const accessToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
            jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                if(err){
                    res.status(403).json("Token is not valid");
                }
                req.user = user;
                next();
            })
        }else{
            res.status(401).json("You're not authenticated");
        }
    },

    verifyTokenAdmin(req, res, next) {
        MiddlewareController.verifyToken(req, res, () => {
            if(req.user.author === "admin"){
                next();
            } else {
                res.status(403).json("Access denied. You do not have the required permissions to view this page.")
            }
        })
    }
}

module.exports = MiddlewareController;
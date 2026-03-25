const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const MiddlewareController = {
    verifyToken(req, res, next) {
        const token = req.headers.authorization || req.headers.token;
        if (token) {
            const accessToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
            jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                if (err) {
                    return res.status(403).json({ message: "Token is not valid" });
                }
                req.user = user;
                next();
            });
        } else {
            return res.status(401).json({ message: "You're not authenticated" });
        }
    },

    verifyTokenAdmin(req, res, next) {
        MiddlewareController.verifyToken(req, res, () => {
            if (req.user.author === "admin") {
                next();
            } else {
                res.status(403).json({
                    message: "Access denied. You do not have the required permissions to view this page.",
                });
            }
        });
    },

    /** Admin hoặc nhân viên — dùng cho CMS / quản trị */
    verifyTokenStaff(req, res, next) {
        MiddlewareController.verifyToken(req, res, () => {
            if (req.user.author === "admin" || req.user.author === "employee") {
                next();
            } else {
                res.status(403).json({
                    message: "Access denied. Staff or admin role required.",
                });
            }
        });
    },
};

module.exports = MiddlewareController;
const { formatDate } = require('../../util/formatDate.util');
const User = require('../model/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const { token } = require('morgan');
const { use } = require('passport');

dotenv.config();

let refreshTokens = [];

class AuthController {
    
    /** [POST] /auth/register */
    async register(req, res, next) {
        try{
            const {frist,last,email,city,street,day,month,year,account,password, confirm,phone} = req.body;
            if(password !== confirm){
                return res.status(404).json("Password and confirm password do not match");
            }
            const name = frist + last;
            const birth = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
            const address = city + street;

            const hashPassword = await bcrypt.hash(password, 10);

            const user = new User({
                account,
                password: hashPassword,
                name,
                address,
                phone,
                email,
                birth
            });

            await user.save();
            res.status(200).json({message: "Register successful"})
        }catch(err){
            res.status(500).json(err);
        }
    }

    /** [POST] /auth/login */
    async login(req, res, next) {
        try{
            console.log(req.body);
            const user = await User.findOne({account: req.body.account});
            if(!user){
                return res.status(404).json("Incorrect account")
            }
            if (!user.password.startsWith("$2b$")) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await User.updateOne({ _id: user._id }, { password: hashedPassword });
                user.password = hashedPassword;
            }
            const validedPass = await bcrypt.compare(
                req.body.password,
                user.password
            )
            if(!validedPass){
                return res.status(404).json("Incorrect password")
            }
            if(user && validedPass){
                const accessToken = jwt.sign(
                    {
                        id: user._id,
                        author: user.authour,
                    },
                    process.env.JWT_ACCESS_KEY,
                    {expiresIn: "2h"}
                );
                const refreshToken = jwt.sign(
                    {
                        id: user._id,
                        author: user.authour,
                    },
                    process.env.JWT_REFRESH_KEY,
                    {expiresIn: "365d"} 
                );
                refreshTokens.push(refreshToken)
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: false,
                    path: "/" ,
                    sameSite: "strict",
                })
                await User.updateOne({ _id: user._id }, { lastLogin: new Date() });
                const { password, ...userWithoutPassword } = user.toObject();
                const formatUser = {
                    ...userWithoutPassword,
                    format: formatDate(user.birth)
                }
                res.status(200).json({
                    message: "Login successful",
                    user: formatUser,
                    accessToken,
                })
            }
        }catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [POST] /auth/refresh */
    requestRefreshToken (req, res, next) {
        try{
            const refreshToken = req.cookies.refreshToken;
            if(!refreshToken){
                res.status(401).json("You're not authenticated");
            }
            if(refreshTokens.includes(refreshToken)){
                res.status(403).json("Refresh token is not vaild")
            }
            jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
                if(err) {
                    res.status(403).json(err);
                }
                refreshTokens = refreshTokens.filter((token) => token !== refreshToken)
                const newAccessToken = jwt.sign(
                    {
                        id: user._id,
                        author: user.authour,
                    },
                    process.env.JWT_ACCESS_KEY,
                    {expiresIn: "2h"} 
                );
                const newRefreshToken = jwt.sign(
                    {
                        id: user._id,
                        author: user.authour,
                    },
                    process.env.JWT_REFRESH_KEY,
                    {expiresIn: "365d"} 
                );
                refreshTokens.push(newRefreshToken);
                res.status(200).json({
                    accessToken: newAccessToken,
                    newRefreshToken: newRefreshToken,
                });
            })
        }catch(err){
            res.status(500).json(err);
        }
    }

    /** [POST] /auth/logout */
    async logout(req, res, next) {
        try{
            res.clearCookie("refreshToken");
            refreshTokens = refreshTokens.filter(token => token !== req.cookies.refreshToken);
            res.status(200).json("Logout successful");
        }catch(err){
            res.status(500).json(err);
        }
    }
}

module.exports = new AuthController();
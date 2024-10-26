const User = require('../models/userModel');

const islogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            next();  // Proceed if the user is logged in
        } else {
            res.redirect('/login');  // Redirect to login if not logged in
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
};

const islogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return res.redirect('/home');  // Redirect to home if already logged in
        }
        next();  // Proceed if the user is not logged in
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    islogin,
    islogout
};

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return next();
        } else {
            return res.redirect("/admin");
        }
    } catch (error) {
        console.error('Error in isLogin middleware:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return res.redirect("/admin/home");
        }
        next();
    } catch (error) {
        console.error('Error in isLogout middleware:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    isLogin,
    isLogout,
};
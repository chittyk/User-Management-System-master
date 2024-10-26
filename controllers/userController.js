const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

const loadRegister = async (req, res) => {
    try {
        const message = req.query.message || '';  // Retrieve message from query, default to empty string if not present
        res.render('registration', { message });  // Pass message to the registration template
    } catch (error) {
        console.log(error.message);
    }
};

const createUser = async (req, res) => {
    try {
        const { email, mno, password } = req.body;

        // Check if a user with the same email or mobile already exists
        const existingUser = await User.findOne({ $or: [{ email }, { mobile: mno }] });

        if (existingUser) {
            return res.redirect(`/register?message=User with this email or mobile already exists`);
        }

        // Hash the password
        const spassword = await securePassword(password);

        // Create a new user if no duplicates are found
        const user = new User({
            name: req.body.name,
            email: email,
            mobile: mno,
            image: req.file.filename,
            password: spassword,
            is_admin: 0
        });

        const userData = await user.save();
        if (userData) {
            return res.redirect(`/register?message=Your registration has been successfully completed.`);
        } else {
            return res.redirect(`/register?message=Your registration has failed.`);
        }
    } catch (error) {
        console.log(error.message);
    }
};

// Login user
const loginLoad = async (req, res) => {
    try {
        const message = req.session.message; // Get any message from the session
        req.session.message = null; // Clear the message after displaying it
        res.render('login', { message }); // Pass the message to the EJS template
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
};

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_admin === 1) {
                    req.session.message = 'Invalid credentials for user login.';
                    return res.redirect('/login');
                } else {
                    req.session.user_id = userData._id;
                    return res.redirect('/home');
                }
            } else {
                req.session.message = 'Email or password incorrect.';
                return res.redirect('/login');
            }
        } else {
            req.session.message = 'Email or password incorrect.';
            return res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
};


const userLogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Internal Server Error');
            }
            // Clear the session cookie with the correct domain and path
            res.clearCookie('connect.sid', { path: '/', domain: 'localhost' });

            // Redirect the user to the login page
            res.redirect('/login');
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
};


const loadHome = async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.redirect('/login'); // Redirect to login page if not authenticated
        }

        const userData = await User.findById(req.session.user_id);
        if (!userData) {
            // If user data not found destroy the session and redirect to login
            return req.session.destroy((err) => {
                if (err) console.log(err.message);
                res.redirect('/login');
            });
        }
        res.render('home', { user: userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const isUser = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        if (!userId) {
            return res.redirect('/login'); // Redirect to login if not logged in
        }

        const user = await User.findById(userId);
        if (user && user.is_admin === 0) {
            next(); // Proceed if the user is a regular user
        } else {
            return res.redirect('/admin/home'); // Redirect to admin home if user is an admin
        }
    } catch (error) {
        console.error('User authentication error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        if (userData) {
            return res.render("edit-info", { user: userData });
        } else {
            return res.redirect("/home");
        }
    } catch (error) {
        console.log(error.message);
    }
};

const updateUser = async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate(
            { _id: req.body.user_id },
            { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno } }
        );
        return res.redirect("/home");
    } catch (error) {
        console.log(error.message);
    }
};
// const hello=async(req,res)=>{
//     try {
//         res.send('heloooo')
//     } catch (error) {
//         console.log(error)
//     }
// }
module.exports = {
    loadRegister,
    createUser, 
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    editUserLoad,
    updateUser,
    isUser,
    
};

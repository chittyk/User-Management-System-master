const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const randomString = require('randomstring');
const config = require('../config/config')

const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
}


// Load the login page
const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.error('Error loading login page:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Verify login 
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_admin === 1) {
                    req.session.user_id = userData._id; // Store user ID in session
                    return res.redirect('/admin/home'); // Redirect to admin home
                } else {
                    return res.render('login', { message: 'You do not have admin privileges' });
                }
            } else {
                return res.render('login', { message: 'Email or password is incorrect' });
            }
        } else {
            return res.render('login', { message: 'Email or password is incorrect' });
        }
    } catch (error) {
        console.error('Error verifying login:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Load admin dashboard
const loadDashboard = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user_id);
        res.render('home', { admin: userData });
    } catch (error) {
        console.error('Error loading dashboard:', error.message);
        res.status(500).send('Internal Server Error');
    }
};


// Admin authentication middleware
const isAdmin = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        if (!userId) {
            return res.redirect('/admin'); // Redirect to admin login if not logged in
        }

        const user = await User.findById(userId);
        if (user && user.is_admin === 1) {
            next(); // Proceed if the user is an admin
        } else {
            return res.redirect('/home'); // Redirect to user home if user is not an admin
        }
    } catch (error) {
        console.error('Admin authentication error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Logout functionality
const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
        console.error('Error logging out:', error.message);
    }
};

const adminDashboard = async (req, res) => {
    try {
        const usersData = await User.find({ is_admin: 0 });

        // Check if there's a message in query parameters
        const message = req.query.message || null; 

        // Pass message to the view
        res.render('dashboard', {
            users: usersData,
            message: message // Pass message to the EJS template
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


// Controller method to render the new-user page
const newUserLoad = (req, res) => {
    const message = req.query.message;  // Extract the 'message' from query parameters
    res.render('new-user', { message });  // Pass the message to the template
};




const addUser = async (req, res) => {
    try {
        const { name, email, mno } = req.body;
        const image = req.file ? req.file.filename : '';
        const password = randomString.generate(8);

        if (!name || !email || !mno || !image) {
            return res.redirect(`/admin/new-user?message=All fields are required`);
        }

        const existingUser = await User.findOne({ $or: [{ email }, { mobile: mno }] });
        if (existingUser) {
            return res.redirect(`/admin/new-user?message=Email or mobile number already in use`);
        }

        const spassword = await securePassword(password);

        const user = new User({
            name,
            email,
            mobile: mno,
            image,
            password: spassword,
            is_admin: 0,
        });

        const userData = await user.save();
        if (userData) {
            return res.redirect(`/admin/new-user?message=New user added successfully`);
        } else {
            return res.redirect(`/admin/new-user?message=Something went wrong, please try again`);
        }
    } catch (error) {
        console.error('Error adding user:', error.message);
        return res.redirect(`/admin/new-user?message=An error occurred while adding the user`);
    }
};


//edit user

const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id; // or req.params.id if using route parameters
        const userData = await User.findById(id); // Correct usage of findById

        if (userData) {
            res.render('edit-user', { user: userData });
        } else {
            res.redirect('/admin/dashboard'); // Redirect if user not found
        }
    } catch (error) {
        console.error('Error loading edit user page:', error.message);
        res.status(500).send('Internal Server Error');
    }
};



const updateUser = async (req, res) => {
    try {
        const userId = req.body.id;

        const updateData = {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
        };

        if (req.file) {
            updateData.image = req.file.filename;
        }

        const userData = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

        if (userData) {
            res.redirect(`/admin/dashboard?message=User updated successfully`);
        } else {
            res.redirect(`/admin/dashboard?message=User not found`);
        }
    } catch (error) {
        console.log('Error updating user:', error.message);
        res.redirect(`/admin/dashboard?message=An error occurred while updating the user`);
    }
};




const deleteUser = async (req, res) => {
    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id });

        // Redirect to dashboard with success message
        res.redirect('/admin/dashboard?message=User deleted successfully');
    } catch (error) {
        console.log('Error deleting user:', error.message);
        res.status(500).send('Internal Server Error');
    }
};



module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    isAdmin,
    logout,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUser,
    deleteUser,

};

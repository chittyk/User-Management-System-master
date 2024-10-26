const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const config = require('../config/config');
const adminController = require('../controllers/adminController');
const nocache = require('nocache');
const auth = require('../middleware/adminAuth');

const admin_route = express();



// Session configuration
admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    
}));

admin_route.use(nocache());

// BodyParser configuration
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/userImages'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage });

// View engine setup
admin_route.set('view engine', 'ejs');
admin_route.set('views', path.join(__dirname, '../views/admin'));

// Define routes
admin_route.get('/', auth.isLogout, adminController.loadLogin); // For login page
admin_route.post('/', adminController.verifyLogin); // For login verification
admin_route.get('/home', auth.isLogin, adminController.isAdmin, adminController.loadDashboard); // For admin dashboard
admin_route.get('/logout', auth.isLogin, adminController.logout); // Logout route
admin_route.get('/dashboard', auth.isLogin, adminController.adminDashboard); // Admin dashboard route


admin_route.get('/new-user', auth.isLogin, adminController.newUserLoad); // Route to load new user form
admin_route.post('/new-user', upload.single('image'), adminController.addUser); // Route to add a new user with file upload
admin_route.get('/edit-user', auth.isLogin, adminController.editUserLoad)
admin_route.post('/edit-user', upload.single('image'), adminController.updateUser);
admin_route.get('/delete-user', adminController.deleteUser);
// Catch-all route
admin_route.get('*', (req, res) => {
    res.redirect('/admin');
});



module.exports = admin_route;
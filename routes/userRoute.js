const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');  
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const nocache = require('nocache');
const config = require('../config/config');  

const user_route = express();

user_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 }
}));



//  nocache middleware to prevent caching
user_route.use(nocache());

user_route.use(express.static('public'));
user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../public/userImages'));
    },
    filename: function(req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage });

// Routes
// user_route.get('/register', auth.islogout, userController.loadRegister);
user_route.get('/register', auth.islogout, userController.loadRegister, (req, res) => {
    const message = req.query.message || '';
    res.render('registration', { message });
});

user_route.post('/register', upload.single('image'), userController.createUser);
user_route.get('/', auth.islogout, userController.loginLoad);
// user_route.get('/login', auth.islogout, userController.loginLoad);
user_route.get('/login', auth.islogout,userController.loginLoad, (req, res) => {
    const message = req.session.message; // Get the message from session
    req.session.message = null; // Clear the message after displaying it
    res.render('login', { message }); // Pass the message to the EJS template
});

user_route.post('/login', userController.verifyLogin);
user_route.get('/home', auth.islogin, userController.isUser, userController.loadHome);
user_route.get('/logout', auth.islogin, userController.userLogout);
user_route.get('/edit', auth.islogin, userController.editUserLoad);
user_route.post('/edit', upload.single('image'), userController.updateUser);
//user_route.get('/hello',userController.hello)

module.exports = user_route;

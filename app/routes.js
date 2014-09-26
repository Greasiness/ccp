// app/routes.js
module.exports = function(app, passport) {

    var User       		= require('../app/models/user');

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('login.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
        User.find({type: 'user'}, function(err, users) {
            if (err) return console.error(err);

            res.render('profile.ejs', {
                user : req.user, // get the user out of session and pass to template
                users: users
            });
        });
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

    app.post('/submit', function(req, res){
        if(req.user.local.email == "admin"){
            User.find({'local.email': req.body.email}, function(err,users){
                if (err) return console.error(err);

                if(users.length) {
                    users[0].local.email = req.body.email;
                    users[0].ccp = req.body.ccp;
                    users[0].save(function(err) {
                        if (err)
                            throw err;
                        res.redirect('/profile');
                    })
                }
            })
        }
    });

    app.post('/remove', function(req, res){
        if(req.user.local.email == "admin"){
            console.log("called2");
            User.remove({'local.email': req.body.email},function(err) { });
            res.redirect('/profile');
        }
    });

    app.post('/add', function(req, res){
        if(req.user.local.email == "admin"){
            User.findOne({ 'local.email' :  req.body.email }, function(err, user) {
                if (err)
                    return done(err);

                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    var newUser            = new User();

                    newUser.local.email    = req.body.email;
                    newUser.ccp = req.body.ccp;
                    newUser.type = "user";

                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }

            });
            res.redirect('/profile');
        }
    });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
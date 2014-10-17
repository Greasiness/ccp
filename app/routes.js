// app/routes.js
module.exports = function(app, passport) {


    var User       		= require('../app/models/user');
    var Item = require('../app/models/item');
    var Changelog = require('../app/models/changelog');
    var validator = require('validator');

    var sendgrid   = require('sendgrid')('app18634011@heroku.com', 'p7uxpdmk');
  

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================

    app.get('/public', function(req, res){
        User.find({type: 'user'}, function(err,users){
            if(err) return console.error(err);

            var retArray = new Array();
            users.forEach(function(user){
                retArray.push({name: user.name, ccp:user.ccp});
            });
            res.render('public.ejs', {
                users: retArray
            });
        })
    })
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

    app.get('/profilestore', isLoggedIn, function(req, res) {
        Item.find({type: 'store'}, function(err, items) {

            if (err) return console.error(err);

            res.render('items.ejs', {
                user : req.user, // get the user out of session and pass to template
                items: items
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

    app.post('/submit', isLoggedIn, function(req, res){
        if(req.user.local.email == "admin"){
            User.find({name: req.body.name}, function(err,users){
                if (err) return console.error(err);

                if(users.length) {
                    users[0].name = req.body.name;
                    if(!isNaN(users[0].ccp))
                        users[0].ccp = req.body.ccp;
                    users[0].email = req.body.email;
                    users[0].save(function(err) {
                        if (err)
                            throw err;
                    })
                }
            })
        }
        res.redirect('/profile');
    });

    app.post('/remove', isLoggedIn,  function(req, res){
        if(req.user.local.email == "admin"){
            User.remove({'local.email': req.body.email},function(err) { });
            res.redirect('/profile');
        }
    });

    app.post('/update', isLoggedIn, function(req, res){
        if(req.user.local.email == "admin"){
            User.remove({type: "user"},function(err) { });
            var csv = req.body.csv;
            var multiline = csv.split(/[\n\r\n]/g);
            multiline.forEach(function (line) {
                var lineKV = line.split(',');
                if (lineKV.length == 3) {
                    var newUser            = new User();
                    newUser.name    = lineKV[0];
                    newUser.email = lineKV[1];
                    newUser.ccp = lineKV[2];
                    newUser.type = "user";
                    newUser.save(function(err) {});
                }
            });
        }
        res.redirect('profile');
    });

    app.post('/add', isLoggedIn, function(req, res){
        if(req.user.local.email == "admin"){
            User.findOne({ 'local.email' :  req.body.email }, function(err, user) {
                if (err)
                    return err;

                if (user) {
                    user.ccp = req.body.ccp;
                    user.save(function(err){
                        if(err)
                            throw err;
                    });
                    res.redirect('/profile');
                } else {

                    var newUser            = new User();

                    newUser.name    = req.body.name;
                    newUser.email = req.body.email;
                    newUser.ccp = req.body.ccp;
                    newUser.type = "user";
                    newUser.UUID = guid();

                    newUser.save(function(err) {});
                }
                res.redirect('/profile');
            });
        }
    });

    function guid() {
        function _p8(s) {
            var p = (Math.random().toString(16)+"000000000").substr(2,8);
            return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
        }
        return _p8() + _p8(true) + _p8(true) + _p8();
    }

    app.post('/addstore', isLoggedIn,  function(req, res){
        if(req.user.local.email == "admin"){
            Item.findOne({ 'name' :  req.body.name }, function(err, item) {
                if (err)
                    return err;

                if (item) {
                    item.ccp = req.body.ccp;
                    item.description = req.body.description;
                    item.quantity = req.body.quantity;
                    item.type = 'store';
                    item.save(function(err){
                        if(err)
                            throw err;
                    });
                    res.redirect('/profile');
                } else {

                    var newItem            = new Item();

                    newItem.name    = req.body.name;
                    newItem.ccp = req.body.ccp;
                    newItem.type = "store";
                    newItem.description = req.body.description;
                    newItem.quantity = req.body.quantity;
                    newItem.active = false;

                    newItem.save(function(err) {});
                }
                res.redirect('/profilestore');
            });
        }
    });

    app.post('/removestore', isLoggedIn,  function(req, res){
        if(req.user.local.email == "admin"){
            Item.remove({name: req.body.name},function(err) { });
            res.redirect('/profilestore');
        }
    });

    app.post('/startstore', isLoggedIn,  function(req, res){
        if(req.user.local.email == "admin"){
            Item.findOne({name: req.body.name},function(err, item) {
                if(item){
                    item.active = true;
                    item.save(function(err){
                        if(err)
                            throw err;
                    })
                    Changelog.findOne({type: 'store'}, function(err, changelog){
                        if(changelog) {
                            changelog.content += item.quantity + " " + item.name + "(s) is now active in the store for " + item.ccp + " cpp.\n";
                            if (changelog.content.length > 10000) {
                                if(changelog.content.indexOf('\n') != -1)
                                    changelog.content = changelog.content.substring(changelog.content.indexOf('\n'));
                             }
                            changelog.save(function(err){
                                if(err)
                                    throw err;
                            })
                        }
                    })
                }
            });
            res.redirect('/profilestore');
        }
    });

    app.post('/stopstore', isLoggedIn,  function(req, res){
        if(req.user.local.email == "admin"){
            Item.findOne({name: req.body.name},function(err, item) {
                if(item){
                    item.active = false;
                    item.save(function(err){
                        if(err)
                            throw err;
                    })
                    Changelog.findOne({type: 'store'}, function(err, changelog){
                        if(changelog) {
                            changelog.content += item.quantity + " " + item.name + "(s) is now inactive in the store for " + item.ccp + " cpp.\n";
                            if (changelog.content.length > 10000) {
                                if(changelog.content.indexOf('\n') != -1)
                                    changelog.content = changelog.content.substring(changelog.content.indexOf('\n'));
                            }
                            changelog.save(function(err){
                                if(err)
                                    throw err;
                            })
                        }
                    })
                }
            });
            res.redirect('/profilestore');
        }
    });

    app.post('/getchangelog', isLoggedIn, function(req,res){
        if(req.user.local.email == "admin"){
            Changelog.findOne({type: req.body.type},function(err, changelog ) {
                res.send({changelog: changelog.content});
            });
        }
    })

    app.get('/getstore', function(req,res){
        Item.find({type:'store', active:true}, function(err, items){
            if(err)
                throw err;
            res.send({store: items})
        })
    })

    app.get('/getauction', function(req,res){
        Item.find({type:'auction', active:true}, function(err, items){
            if(err)
                throw err;
            res.send({store: items})
        })
    })

    app.get('/loadstore', function(req, res){
       Item.find({active:true}, function(err, items){
           res.render('members.ejs', {
              items: items
           });
       })
    });

    app.post('/buystore', function(req,res){

        if(!validator.isUUID(req.body.UUID)){
            res.send("Not a valid passcode.")
            return;
        }

        User.findOne({UUID: req.body.UUID}, function(err, user){
            if(err){
                res.end("There was an error, try again later.");
                throw err;
                return;
            }
            if(user){
                Item.findOne({name:req.body.name}, function(err, item){
                    if(err){
                        res.end("There was an error, try again later.");
                        throw err;
                        return;
                    }
                    if(item) {
                        if (user.ccp >= item.ccp && item.active) {
                            Changelog.findOne({type: 'store'}, function (err, changelog) {
                                if (err) {
                                    res.end("There was an error, try again later.");
                                    throw err;
                                    return;
                                }
                                if (changelog) {
                                    changelog.content += user.name + " bought a " + item.name + " for " + item.ccp + " ccp."
                                    if (changelog.content.length > 100000) {
                                        if (changelog.content.indexOf('\n') != -1)
                                            changelog.content = changelog.content.substring(changelog.content.indexOf('\n'));
                                    }
                                    changelog.save(function (err) {
                                        if (err) {
                                            res.end("There was an error, try again later.");
                                            throw err;
                                            return;
                                        }
                                        user.ccp = user.ccp - item.ccp;
                                        user.save(function (err) {
                                            if (err) {
                                                res.end("There was an error, try again later.");
                                                throw err;
                                                return;
                                            }

                                            res.send("Success! Your ccp is now at " + user.ccp);
                                            return;
                                        })
                                    })
                                }
                            })
                        } else {
                            res.send("You do not have enough ccp or the item is no longer in the store.")
                            return;
                        }
                    } else {
                        res.send("Item not found.");
                        return;
                    }
                })
            } else {
                res.send("Passcode not recognized.")
                return;
            }
        })
    })

};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

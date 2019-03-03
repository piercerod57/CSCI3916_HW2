var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //global hack
var jwt = require('jsonwebtoken');


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObject(req) {
    var json = {
        headers : "No Headers",
        key: process.env.UNIQUE_KEY,
        body : "No Body"
    };

    if (req.body != null) {
        json.body = req.body;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.route('/post')
    .post(authController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            var o = getJSONObject(req);
            res.json(o);
        }
    );

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.post('/signup', function(req, res) {
	if(req.body != null){
		var responseBody = req.body;//@NOTE(P): sends back query parameters
    }else{var responseBody = null;}
	let responseHeader = req.headers;//@NOTE(P): sends back query headers
	
	if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
    } else {
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };
        // save the user
		var testVar = db.findOne(newUser);
        if(db.findOne(newUser) == false){
			res.json({success: false, msg: 'User already Exists.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
		}else{
			db.save(newUser);
			res.json({success: true, msg: 'Successful created new user.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY, test: testVar});
		}
    }
});

router.post('/signin', function(req, res) {
		if(req.body != null){
			var responseBody = req.body;//@NOTE(P): sends back query parameters
		}else{var responseBody = null;}
		let responseHeader = req.headers;//@NOTE(P): sends back query headers
        var user = db.findOne(req.body.username);

        if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
        }
        else {
            // check if password matches
            if (req.body.password == user.password)  {
                var userToken = { id : user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token, query: req.query});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
            }
        };
});

/*
HTTP Method: GET should return { 
status: 200, 
message: ‘GET movies”,  
headers: header from request,
query: query string from request,
env: your unique key
*/
router.get('/movies', function(req, res) {
		if(req.body != null){
			var responseBody = req.body;//@NOTE(P): sends back query parameters
		}else{var responseBody = null;}
		let responseHeader = req.headers;//@NOTE(P): sends back query headers
        
		var movie = db.find(req.body.movieid);
		if(!movie){
			res.status(401).send({success: false, msg: "movie not found", headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
		}else{
			res.json({msg: "movie found", headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY, user: movie});
		}
});

/*
 “status”:  200,  
 message:  “movie saved”, 
 headers: headers: header from request,
query: query string 
env: your unique key
}*/
router.post('/movies', function(req, res) {
		if(req.body != null){
			var responseBody = req.body;//@NOTE(P): sends back query parameters
		}else{var responseBody = null;}
		let responseHeader = req.headers;//@NOTE(P): sends back query headers
        //@TODO(P): find function
		var movie = db.find(req.body.movieid);
		if(!movie){
			res.status(401).send({success: false, msg: "movie already exists", headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
		}else{
			
			
			res.json({msg: "Created", headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
		}
});


/*
status:  200,  message:  “movie updated”
headers: header from request,
query: query string from request, 
env: your unique key
*/
router.put('/movies', function(req, res) {//requires jwtauth
		if(req.body != null){
			var responseBody = req.body;//@NOTE(P): sends back query parameters
		}else{var responseBody = null;}
		let responseHeader = req.headers;//@NOTE(P): sends back query headers
		var movie = db.find(req.body.movieid);
		var user = db.findOne(req.body.username);

		if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
        }
        else {
            // check if password matches
            if (req.body.password == user.password)  {
				//@NOTE(P): update movie db
                var userToken = { id : user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
				
					if (req.body.password == user.password)  {
						if(!movie){
							res.status(401).send({success: false, msg: "Error: Can't find movie", token: 'JWT ' + token, headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
						}else{
							var result = db.update(movie, user);
							if(result === 1){
								res.json({msg: "movie updated", token: 'JWT ' + token, headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
							}else if(result === 0){
								res.status(401).send({success: false, msg: "Error: movie not updated", token: 'JWT ' + token, headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
							}
						}
					}
			}else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
            }
        };
});


/*
“status:  200,  
message:  “movie deleted”
headers: header from request,
query: query string from request, 
env: your unique key
*/
router.delete('/movies', function(req, res) {//requires auth
		if(req.body != null){
			var responseBody = req.body;//@NOTE(P): sends back query parameters
		}else{var responseBody = null;}
		let responseHeader = req.headers;//@NOTE(P): sends back query headers
        var user = db.findOne(req.body.username);
		var movie = db.find(req.body.movieid);
		
		if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
        }
        else {
            // check if password matches
            if (req.body.password == user.password)  {
				//@NOTE(P): Remove movie from db
				if(!movie){
					res.status(401).send({success: false, msg: "Error: Can't find movie", headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
				}else{
					var found = db.remove(movie);
					res.json({msg: "movie deleted", headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY, found: found});
				}
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.', headers: responseHeader, query: responseBody, env: process.env.UNIQUE_KEY});
            }
        };
});



app.use('/', router);
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing
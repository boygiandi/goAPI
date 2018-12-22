var functions = require('firebase-functions');
var express = require('express');
var config = require('./config.js');
var controller = new (require(`./controller.js`))(__dirname+"/classes", config);
var admin = require('firebase-admin');
var db = null;
var args = process.argv.slice(2);
if ( args[0]==='local' ) {
	const serviceAccount = require("./firebase-admin.json");
	const adminConfig = process.env.FIREBASE_CONFIG?JSON.parse(process.env.FIREBASE_CONFIG):config.firebase;
	adminConfig.credential = admin.credential.cert(serviceAccount);
	admin.initializeApp(adminConfig);
} else {
	admin.initializeApp(functions.config().firebase);
}
var db = admin.firestore();
db.settings({timestampsInSnapshots: true});

var app = express();
app.use (function(req, res, next) {
    var data='';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { 
       data += chunk;
    });

    req.on('end', function() {
        req.body = data;
        next();
    });
});

function serve(controll, action, args) {
	if ( !controller[controll] )
		return Promise.reject(controller.returnError("controller_not_found"));
	if ( !controller[controll][action] )
		return Promise.reject(controller.returnError("action_not_found"));
	
	return controller[controll][action](db, args);
}
function valid_args(req) {
	let date = new Date();
	req.query['now'] = parseInt(date.getTime()/1000);
	
	const valid_request = controller.validRequest(req);
	if ( valid_request.error )
		return Promise.reject(valid_request);

	if ( req.body && typeof req.body==="string" ) req.body = JSON.parse(req.body);
	let args = Object.assign(req.query, req.body);
	args['host'] = (req.headers['x-forwarded-host'] || req.headers.host).split(":").shift();
	args['clientip'] = req.headers['fastly-client-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress.replace("::ffff:", "");
	args['clientip'] = args['clientip'].split(",").shift().trim();

	return Promise.resolve(args);
}

app.use('/static', express.static('static'));

app.all(config['sub_path']+'/:controller/:action*?', function (req, res) {
	const origin = req.get('Origin');
	console.log("origin", origin);
	if ( config['origin'].indexOf(origin)>-1 )
		res.setHeader("Access-Control-Allow-Origin", origin);
	if (req.method === 'OPTIONS') {
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
		res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
		res.send(200);
		return;
	}

	valid_args(req).then(async (args) => {
		const action = req.method + (req.params['action']?("_"+req.params['action']):"");
		const authorization = req.get('Authorization');
		if ( authorization ) {
			const tokenId = authorization.split('Bearer ')[1];
			args.userInfo = await admin.auth().verifyIdToken(tokenId);
		}

		return serve(req.params['controller'], action, args).then(response => {
			if ( response.error )
				throw response;
			else
				res.send(response);
		});
	}).catch((error) => {
		res.statusCode = 500;
		res.send(controller.returnError(error));
	});
});

app.get('/*', function (req, res) {
	res.statusCode = 404;
	res.send("404 not found");
});


exports.app = functions.https.onRequest(app);

for ( let name in controller )
	if ( controller[name].listeners )
		Object.assign(exports, controller[name].listeners(functions, db));

if ( args[0]==='local' ) {
	app.listen(config.port);
	console.log(`Application running on port ${config.port}!`);
}

//-------------------------------------------------
//	Dendrite
//	Developed & managed by StarColon Projects
//	EST: January 2015
// 		http://starcolon.com/
//-------------------------------------------------
/*
/*	Usage: Run [Celebroid.js] via node.js
//-------------------------------------------------
*/

var myMentor = {};
const appVersion = 0.0001;
const appName = 'Celebroid';
var serviceUrl = ''; // To be assigned run-time when server starts

// Initialize project dependencies
var app = require('express')();
var colors = require('colors');
var jade = require('jade');
var fs = require('fs');
var bodyParser = require('body-parser');
var mentor = require('./lib/mentor.js');


(function loop(config){
	// Initializ the mentor object
	myMentor = new mentor.mentor(config.dbName,config.dbCollectionName);

	// Initialize the server model
	configServer(app,bodyParser);

	// Load the current state of the lessons to the memory
	myMentor.recall();


	// Run the server listen loop
	var server = app.listen(config.port, function(){
		var host = server.address().address;
		var port = server.address().port;
		serviceUrl = 'http://'+host+':'+port+'/';

		console.log('****************************************************'.cyan);
		console.log(('      '+appName.toUpperCase()+' starts!').toString().cyan );
		console.log('      listening carefully at:'.cyan + (host + ':' + port).toString().green );
		console.log('****************************************************'.cyan);
		console.log('');
	});

})({
	port: 4096,
	dbName: 'test',
	dbCollectionName: 'celebroid-lessons'
});


function configServer(app,bodyParser){
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	// Allow cross-origin XHR accesses
	app.all('*', function(req, res, next) {
	  res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');
	  next();
	});

	// Map REST parameters
	app.param('v',function(req,resp,next,v){
		// parameter [v] must be a JSON format
		req.v = v;
		return next();
	});
 
	// Map REST verbs
	app.get('/', httpShowGuide);
	app.get('/lesson/label/add/:v', httpAddLabel);
	app.get('/lesson/state/add/:v', httpAddState);
	app.get('/lesson/state/emission/:v', httpAddEmission);
	app.get('/lessson/state/transition/:v', httpAddTransition);
	app.get('/lesson/ls/', httpLsLesson);
}



function httpShowGuide(req,resp,next){
	// Display the quick guide document
	fs.readFile('./html/quick-guide.jade', 'utf-8', function(error, source){
		var data = {
			projectname: appName,
			projectversion: appVersion,
			projecturl: serviceUrl
		};
		var html = jade.compile(source)(data);
  		resp.send(html);
  	});
}


function httpAddLabel(req,resp,next){
	console.log('Set label :'.green);
	console.log(req.v);
	myMentor.setLabels(req.v);
}


function httpAddState(req,resp,next){
	console.log('Set state :'.green);
	console.log(req.v);
	myMentor.setState(req.v);
}


function httpAddEmission(req,resp,next){
	console.log('Set emission :'.green);
	console.log(req.v);
	myMentor.setEmission(req.v);
}


function httpAddTransition(req,resp,next){
	console.log('Set transition :'.green);
	console.log(req.v);
	myMentor.setTransition(req.v);
}


function httpLsLesson(req,resp,next){
	// Print out the lesson
	myMentor.showLessons();
	resp.send(myMentor.lessons);
}


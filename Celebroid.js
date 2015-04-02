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
var package_json = require('./package.json')
const appVersion = package_json.version;
const appName = package_json.name;
var serviceUrl = ''; // To be assigned run-time when server starts

// Initialize project dependencies
var app = require('express')();
var colors = require('colors');
var jade = require('jade');
var fs = require('fs');
var bodyParser = require('body-parser');
var mentor = require('./lib/mentor.js');


(function loop(config){
	// Initialize the mentor object
	var done = function(){
		console.log('Database successfully loaded'.yellow);
	}
	myMentor = new mentor.mentor(config.dbName,config.dbCollectionName,done);

	// Initialize the server model
	configServer(app,bodyParser);

	// Run the server listen loop
	var server = app.listen(config.port, function(){
		var host = server.address().address;
		var port = server.address().port;
		serviceUrl = 'http://'+host+':'+port+'/';

		console.log('****************************************************'.cyan);
		console.log(('      '+appName.toUpperCase()+' starts!').toString().cyan );
		console.log('      listening carefully at:'.cyan + (host + ':' + port).toString().green );
		console.log('****************************************************'.cyan);
		console.log('   arguments = '.cyan + getArgs().yellow);
		console.log('');
	});

})({
	port: 4096,
	dbName: 'test',
	dbCollectionName: 'celebroid_lessons'
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

	app.param('w',function(req,resp,next,w){
		// Parameter [w] must be an object identifier
		req.w = w;
		return next();
	});

	app.param('p',function(req,resp,next,p){
		// parameter [p] must be double 
		req.p = parseFloat(p);
		return next();
	});
 
	// Map REST verbs
	app.get('/', httpShowGuide);
	app.get('/lesson/label/:v', httpAddLabel);
	app.get('/lesson/state/:v/:p', httpAddState);
	app.get('/lesson/state/:v/:w/:p', httpAddEmission);
	app.get('/lesson/state/:v/to/:w/:p', httpAddTransition);
	app.get('/lesson/ls/', httpLsLesson);
	app.get('/lesson/save/', httpSave);
	app.get('/lesson/verify/', httpVerify);
	app.get('/lesson/compile', httpCompile);
	app.get('/predict/:w', httpPredict);
	app.get('/test/',httpTest);
}


function getArgs(){
	// The first two arguments are omitted because the form is "node Celebroid --something --yeah"
	// TAONOTE: This is not yet working, it returns `undefined`
	return process.argv.splice(0,2);
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
	var labels = req.v.split(',');
	myMentor.setLabels(labels);

	// Display the result
	return httpLsLesson(req,resp,next);
}


function httpAddState(req,resp,next){
	console.log('Set state :'.green);
	var state = { state: req.v, p: req.p };
	console.log(state);
	myMentor.setState(state);

	// Display the result
	return httpLsLesson(req,resp,next);
}


function httpAddEmission(req,resp,next){
	console.log('Set emission :'.green);
	var emission = {
		label: req.w,
		p: req.p
	};

	myMentor.setEmission(req.v, emission);

	// Display the result
	return httpLsLesson(req,resp,next);
}


function httpAddTransition(req,resp,next){
	console.log('Set transition :'.green);
	var trans = {
		from: req.v,
		to: req.w,
		p: req.p
	};

	myMentor.setTransition(trans);

	// Display the result
	return httpLsLesson(req,resp,next);
}


function httpCompile(req,resp,next){
	console.log('Compile the course!'.cyan);
	myMentor.learn();

	resp.send('Model compiled!');
}


function httpVerify(req,resp,next){
	// Verify the lessons
	var isPassed = myMentor.verifyLessons(function(msg){
		console.log(msg.toString().red);
	});

	if (isPassed){
		var template = 'span(style="color:green") Lessons verified';
		resp.send(jade.compile(template)());
	}
	else{
		var template = 'span(style="color:red") Lessons illegal - see console log';
		resp.send(jade.compile(template)());
	}
}	


function httpSave(req,resp,next){
	// Save the lessons to the database
	if (!myMentor.save()){
		var template = 'span(style="color:red") Lessons save failed - see console log';
		resp.send(jade.compile(template)());
	}
	else{
		resp.send('Lessons saved!');
	}
}

function httpPredict(req,resp,next){
	var chainOfLabels = req.w.split(',');
	var result = myMentor.predictFromLabels(chainOfLabels);

	resp.send('Result: ' + result.states.join(' ==> ') + ' of conficdence level of ' + (result.p*100).toFixed(3) + ' %');
}


function httpLsLesson(req,resp,next){
	// Print out the lesson
	var output = myMentor.showLessons().join('<br/>');
	resp.send(output);
}

function httpTest(req,resp,next){
	// Test the hiddent markov model
	myMentor.testHMM();
	resp.send('see log for test results');
}


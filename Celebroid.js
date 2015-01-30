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


(function loop(config){

	// Initialize the dependencies
	var app = require('express')();
	var colors = require('colors');
	var bodyParser = require('body-parser');
	var avlTree = require('./lib/avltree.js');
	var db = require('mongoose');

	// Initialize the server model
	configServer(app,bodyParser);

	// Map REST verbs
	app.put('/lesson/add/:v', httpAddLesson);
	app.get('/lesson/ls/', httpLsLesson);


	// Run the server listen loop
	var server = app.listen(config.port, function(){
		var host = server.address().address;
		var port = server.address().port;

		console.log('****************************************************'.cyan);
		console.log('      CELEBROID starts!'.cyan );
		console.log('      listening carefully at:'.cyan + (host + ':' + port).toString().green );
		console.log('****************************************************'.cyan);
		console.log('');
	});

})({
	port: 4096
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
}



function httpAddLesson(req,resp,next){
	// Encapsulate the input format
	var lesson = {
		label: req._label,
		state: req._state,
		nextState: req._nextState,
		p: req._p
	};



}



function httpLsLesson(req,resp,next){
}


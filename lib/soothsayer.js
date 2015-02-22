//-------------------------------------------------
//  Soothsayer
//  Developed & managed by StarColon Projects
//  Aimed to be utilized with [node.js] app
//  EST: February 2015
//      http://starcolon.com/
//-------------------------------------------------
// Bayesian network based learning kit

// Custom exception types
var BreakException = function(){};

// Add module dependencies
graph = require('./graph.js');


soothsayer = function(dbName,collectionName,done){
	this.mongo = require('mongodb');
	this.mongoose = require('mongoose');

	// Connect to the database
	if (typeof(collectionName)=='undefined'){
		console.error('@Soothsayer requires a collectionName to continue.');
		return null;
	}


	// Initialize the data model
	initDatabase.apply(this,[dbName, collectionName, done]);

}


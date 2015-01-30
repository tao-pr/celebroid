//-------------------------------------------------
//  BinaryTree
//  Developed & managed by StarColon Projects
//  Aimed to be utilized with [node.js] app
//  EST: Janurary 2015
//      http://starcolon.com/
//-------------------------------------------------

// DESIGN NODE: Always use fluent interface
/*
	.recall()			==>	Recall the most recent state of learning from the db
	.clear()			==> Clear the memorized lessons







*/


	


var mentor = function(dbName,collectionName){
	this.db = require('mongoose');

	// Connect to the database
	if (typeof(collectionName)=='undefined'){
		console.error('@Mentor requires a collectionName to continue.');
		return null;
	}


	if (!this.db.connect('mongodb://localhost/'+dbName)){ // TAOTODO: When deploy to AWS, this needs to be overridden by the config
		console.error('@Mentor is unable to connect to the mongodb.');
		return null;
	}

	// Initialize the data model
	this.lessonSchema = new this.db.Schema({ name: 'string', size: 'string' });
	this.Lesson = this.db.model('lesson', lessonSchema);

	// Done!
}


mentor.prototype.labels	= []; //{ l: FOO, p: 0.000001}
mentor.prototype.transitions = []; // { from: FOO, to: BAR, p: 0.000000001 }


mentor.prototype.recall = function(){

}


mentor.prototype.clear = function(){
	this.labels = [];
	this.transitions = [];
}

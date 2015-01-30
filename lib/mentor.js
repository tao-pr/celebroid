//-------------------------------------------------
//  Mentor
//  Developed & managed by StarColon Projects
//  Aimed to be utilized with [node.js] app
//  EST: Janurary 2015
//      http://starcolon.com/
//-------------------------------------------------
// Hidden Markov Model based lesson learner engine

/*
	lessons : {
		labels: [label1, label2, ...],
		states: [
			{
				state: state123,
				p: 0.00000000001,
				trans: { nextstate123: 0.00000001, nextstate345: 0.0000001 },
				obs: { label1: 0.0001, label2, 0.000003 }
			},
			{
				state: state345,
				p: 0.00000000001,
				trans: { nextstate123: 0.00000001, nextstate345: 0.0000001 },
				obs: { label2: 1.00000000 }
			},
			...
		]
	}


*/



// DESIGN NODE: Always use fluent interface
/*
	.recall()								==>	Recall the most recent state of learning from the db
	.clear()								==> Clear the memorized lessons
	.setLabels([labels])					==> Set labels
	.setState({state,p})						==> Set state with initial probability
	.setTransition({from,to,p})				==> Set state transition probability
	.setEmission(state,{label,p})				==> Set emission probability


*/


var smartArray = require('./smart-array.js');


var mentor = function(dbName,collectionName){
	this.db = require('mongoose');
	this.hmm = require('./hmm.js');

	// Clear & initialize the lessons
	this.clear();

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
	// TAOTODO: Below hasn't been tested 
	this.lessonSchema = new this.db.Schema({ name: 'string', size: 'string' });
	this.Lesson = this.db.model('lesson', lessonSchema);

	// Done!

}


mentor.prototype.lessons = [];


mentor.prototype.recall = function(){
	// Clear the memory first
	this.clear();

	// Now read the saved lessons from the db
	// TAOTODO:
}


mentor.prototype.clear = function(){
	this.lessons = {
		labels: [],
		states: []
	};
	return this;
}

mentor.prototype.learn = function(){

}


mentor.prototype.save = function(){

}

mentor.prototype.setState = function(state){
	// Replace the existing one if any
	// TAOTODO:
}


mentor.prototype.setLabels = function(labels){
	labels.forEach(function(el){
		// Do not register again if already exist
		if (!this.lessons.labels.hasOwnProperty(el))
			this.lessons.labels.push(el);
	})
}


mentor.prototype.setEmission = function(s,emission){
	// Replace if already exists

}
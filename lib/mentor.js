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
	.setState({state,p})					==> Set state with initial probability
	.setTransition({from,to,p})				==> Set state transition probability
	.setEmission(state,{label,p})			==> Set emission probability
	.showLessons()							==> Display the lessons object

*/


var smartArray = require('./smart-array.js');


mentor = function(dbName,collectionName){
	this.db = require('mongoose');
	this.hmm = require('./hmm/hmm.js');

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
	this.Lesson = this.db.model('lesson', this.lessonSchema);

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
	// TAOTODO: Let the HDD learn from the samples
}


mentor.prototype.save = function(){
	// TAOTODO: Save all lessons to the database
}

mentor.prototype.showLessons = function(){
	console.log(this.lessons);
}

mentor.prototype.setState = function(state){
	// Replace the existing one if any
	try{
		this.states.forEach(function(el,i){
			if (el.state == state.state){
				// State found, set the initial probability now
				el.p = state.p;
				this.states[i] = el;
				throw BreakException;
			}
		});

		// No existing state found
		// Add a fresh new state
		this.states.push({
			state: state.state,
			p: state.p,
			trans: {},
			obs: {}
		});
	}
	catch (e){
		// Break should get trapped into here
		if (e != BreakException) throw e;
	}
}


mentor.prototype.setLabels = function(labels){
	labels.forEach(function(el){
		// Do not register again if already exist
		if (!this.lessons.labels.hasOwnProperty(el))
			this.lessons.labels.push(el);
	})
}


mentor.prototype.setTransition = function(trans){
	// The "From" state must already exist, otherwise, it won't do anything with the transition records
	try{
		if (this.states.length==0) {
			console.error('@Mentor found the states is empty. Unable to set the transition.');
			return this;
		}
		this.states.forEach(function(el,i){
			if (el.state == trans.from){
				// "From" state found
				// Add a new "To" state, this will potentially replace the existing one if any
				el.trans[trans.to.toString()] = trans.p;
				this.states[i] = el;
				throw BreakException;
			}
			// "From" state not match, proceed to the next element
		});
	}
	catch (e){
		// Break should get trapped into here
		if (e!==BreakException) throw e;
	}

	return this;
}

mentor.prototype.setEmission = function(s,emission){
	// Replace if already exists
	try{
		if (this.states.length==0){
			console.error('@Mentor found the states is empty. Unable to set the emission.');
			return this;
		}
		this.states.forEach(function(el,i){
			if (el.state == s){
				// "From" state found 
				// Add an observation
				el.obs[emission.label.toString()] = emission.p;
				this.states[i] = el;
				throw BreakException;
			}
		});
	}
	catch (e){
		// Break should get trapped into here
		if (e!==BreakException) throw e;
	}

	return this;
}





// Export the module for Node.js use
exports.mentor = mentor;
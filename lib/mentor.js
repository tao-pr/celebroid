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

var stateSchema = {
	state: String,
	p: Number,
	trans: {},
	obs: {}
};


// DESIGN NODE: Always use fluent interface
/*
	.clear()								==> Clear the memorized lessons
	.setLabels([labels])					==> Set labels
	.setState({state,p})					==> Set state with initial probability
	.setTransition({from,to,p})				==> Set state transition probability
	.setEmission(state,{label,p})			==> Set emission probability
	.showLessons()							==> Display the lessons object
	.verifyLessons(callbackEach)			==> Verify if the sum of probabilties of each state & label look alright
	.save()									==> Save the lessons to the database
	.fromJSON(json)							==> Import lessons from JSON [TAOTODO:]
*/

const _MONGO_RESERVED_KEYS = ['_parent','_atomics','_path','validators','_schema'];
const _MENTOR_RESERVED_KEY = '__m';
var smartArray = require('./smart-array.js');

// Custom exception types
var BreakException = function(){};


mentor = function(dbName,collectionName){
	this.mongo = require('mongodb');
	this.mongoose = require('mongoose');
	this.hmm = require('./hmm/hmm.js');

	// Connect to the database
	if (typeof(collectionName)=='undefined'){
		console.error('@Mentor requires a collectionName to continue.');
		return null;
	}


	// Initialize the data model
	initDatabase.apply(this,[dbName, collectionName]);

}


// ------------------------ mentor property definitions ---------------------------

mentor.prototype.lessons = [];



// ------------------------ mentor method definitions -----------------------------

function initDatabase(dbName,collectionName) {
	var self = this;
	self.mongoose.connect('mongodb://localhost/'+dbName);
	self.db = self.mongoose.connection;  

	self.db.on('error', console.error.bind(console, '@Mentor fails to connect to mongo:'));
	self.db.once('open', function() {  
	    self.lessonSchema = new self.mongoose.Schema({  
	        labels: [],
	        states: [new self.mongoose.Schema(stateSchema)] 
	    });  
	    
	    // Register the associated data model
	    self.LessonModel = self.mongoose.model('Lessons', self.lessonSchema, collectionName);  

	    // Now load the record
	    self.LessonModel.findOne(function(err, lesson){  
	        if(err) return console.error(err);  
	        
	        // Load the lesson to the class memory
	        console.log('@Mentor is reading the lesson from the DB:');
	        if (lesson == null) {
	        	console.log('... No lessons found');
	        	self.clear();
	        }
	        else{
	        	console.log(lesson);
	        	self.lessons = lesson;
	        	console.log('@Mentor reads the lessons successfully ❤'.green);
	        }
	    })  
	  
	});
}


mentor.prototype.clear = function(){
	this.lessons = new this.LessonModel();
	console.log('Flush lessons:');
	console.log(this.lessons);
	return this;
}


mentor.prototype.learn = function(){
	// TAOTODO: Let the HMM learn from the samples

	// Convert lessons to the HMM's compatible input raw data
	var labels = this.lessons.labels;
	var states = this.lessons.states.select('state');
	var initialProbs = this.lessons.states.map(function(el){
		return {};
	});

}


mentor.prototype.save = function(){
	console.log('@Mentor is saving the lessons...'.green);
	// Save all lessons to the database
	if (typeof(this.lessons)=='undefined' || this.lessons.length<=0){
		console.error('@Mentor does not have lessons to save.');
		return false;
	}

	this.lessons.save(function(err,lesson){
		if (err) { console.error(err.toString().red); return false; }
		else console.dir(lesson);
		console.log('@Mentor saved the lessons ❤'.green);
		return true;
	});

	return true;
}

mentor.prototype.showLessons = function(){
	// Display registered labels
	var result = ['Labels : '];

	this.lessons.labels.forEach(function(lbl){result.push('> ' + lbl)});

	// Display registered states
	this.lessons.states.forEach(function(s){
		result.push('State : ' + s.state + ' p=' + s.p.toFixed(2));
		
		// Transition
		Object.keys(s.trans).forEach(function(t){
			if (_MENTOR_RESERVED_KEY==t || _MONGO_RESERVED_KEYS.indexOf(t)>-1){
				return;
			}

			result.push('===> trans to ['+t+'] p=' + s.trans[t].toFixed(2));
		});
		
		// Observed as
		Object.keys(s.obs).forEach(function(ob){
			if (_MENTOR_RESERVED_KEY==ob || _MONGO_RESERVED_KEYS.indexOf(ob)>-1){
				return;
			}

			result.push('~~~> observed as ['+ob+'] p=' + s.obs[ob].toFixed(2));
		});
	});

	return result;
}

mentor.prototype.setState = function(state){
	// Replace the existing one if any
	try{
		var self = this;
		this.lessons.states.forEach(function(el,i){
			if (el.state == state.state){
				// State found, set the initial probability now
				el.p = state.p;
				self.lessons.states[i] = el;
				throw BreakException;
			}
		});

		// No existing state found
		// Add a fresh new state
		this.lessons.states.push({
			state: state.state,
			p: state.p,
			trans: {__m:0}, // The reserved key is defined to prevent the object from being undefined
			obs: {__m:0}
		});
	}
	catch (e){
		// Break should get trapped into here
		if (e != BreakException) throw e;
	}
}


mentor.prototype.setLabels = function(labels){
	var self = this;
	labels.forEach(function(el){
		// Do not register again if already exist
		if (self.lessons.labels.indexOf(el)<0)
			self.lessons.labels.push(el);
	})
}


mentor.prototype.setTransition = function(trans){
	// The "From" state must already exist, otherwise, it won't do anything with the transition records
	try{
		if (this.lessons.states.length==0) {
			console.error('@Mentor found the states is empty. Unable to set the transition.');
			return this;
		}
		var self = this;
		this.lessons.states.forEach(function(el,i){
			if (el.state == trans.from){
				// "From" state found
				// Add a new "To" state, this will potentially replace the existing one if any
				el.trans[trans.to.toString()] = trans.p;

				console.log('--------'.yellow);
				console.log(el);
				console.log('--------'.yellow);

				self.lessons.states[i] = el;
				throw BreakException;
			}
			// "From" state not match, proceed to the next element
		});

		console.error(('State ['+trans.from+'] not found').toString().red);
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
		if (this.lessons.states.length==0){
			console.error('@Mentor found the states is empty. Unable to set the emission.');
			return this;
		}
		var self = this;
		this.lessons.states.forEach(function(el,i){
			if (el.state == s){

				console.log('--------'.yellow);
				console.log(el);
				console.log('--------'.yellow);

				// "From" state found 
				// Add an observation
				el.obs[emission.label.toString()] = emission.p;
				self.lessons.states[i] = el;
				throw BreakException;
			}
		});

		console.error(('State ['+s+'] not found').toString().red);
	}
	catch (e){
		// Break should get trapped into here
		if (e!==BreakException) throw e;
	}

	return this;
}


mentor.prototype.verifyLessons = function(callbackEach){
	if (typeof(callbackEach)!='function'){
		callbackEach = console.log;
	}

	var self = this;
	var result = true;

	// State check
	var sumStateProb = 0.0;
	self.lessons.states.forEach(function(s){
		sumStateProb += s.p;

		// Check sum of state transition
		var sumOfTrans = 0.0;
		if (typeof(s.trans)=='undefined'){
			callbackEach.apply(this,[('['+ s + '] has no transitions')]);
			result &= 0;
			return;
		}

		Object.keys(s.trans).forEach(function(t){

			// Skip mongo reserved terms
			if (_MONGO_RESERVED_KEYS.indexOf(t)>-1 || _MENTOR_RESERVED_KEY==t){
				return;
			}

			// Destination state exists?
			if (self.lessons.states.filter(function(r){return r.state==t}).length<=0){
				callbackEach.apply(this,['Transition from ['+s.state+'] ==> ['+t+'] not valid']);
				result &= 0;
			}
			else{
				sumOfTrans += s.trans[t];
			}
		});

		if (sumOfTrans!=1.0){
			callbackEach.apply(self,['Total sum of transition prob from ['+s.state+'] not equal to 1 (got '+sumOfTrans+')']);
			result &= 0;
		}

		// Check state observation (HMM's emissions)
		var sumOfObs = 0.0;
		if (typeof(s.obs)=='undefined'){
			callbackEach.apply(self,['['+s.state+'] has no observations defined']);
			result &= 0;
			return;
		}

		Object.keys(s.obs).forEach(function(ob){

			// Skip mongo reserved terms
			if (_MONGO_RESERVED_KEYS.indexOf(ob)>-1 || _MENTOR_RESERVED_KEY==ob){
				return;
			}
			// Destination label exists?
			if (self.lessons.labels.indexOf(ob)<=-1){
				callbackEach.apply(this,['['+s.state+'] cannot be observed as ['+ob+']']);
				result &= 0;
			}
			else{
				sumOfObs += s.obs[ob];
			}
		});

		if (sumOfObs!=1.0){
			callbackEach.apply(this,['Total sum of the emission prob of [' +s.state +'] not equal to 1 (got +'+sumOfObs+')']);
		}
	});

	if (sumStateProb!=1.0){
		callbackEach.apply(this,['Total sum of initial state prob not equal 1']);
		result &= 0;
	}



	return result;
}


// Export the module for Node.js use
exports.mentor = mentor;
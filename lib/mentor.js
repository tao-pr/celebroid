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
	.predictFromLabels([labels])			==> Predict what's the next label
	.likelihood([labels],[states])			==> Measure the likelihood of the state chain and its labels
	.learn()								==> Compile the Hidden markov model from the given lessons
	.save()									==> Save the lessons to the database
	.testHMM()								==> DEBUG PURPOSE: Test the HMM
*/

const _MONGO_RESERVED_KEYS = ['_parent','_atomics','_path','validators','_schema'];
const _MENTOR_RESERVED_KEY = '__m';
var smartArray = require('./smart-array.js');

// Custom exception types
var BreakException = function(){};

// Utility functions --------------
var equal = function(a,b){ return parseFloat(a.toFixed(2))==parseFloat(b.toFixed(2))}


mentor = function(dbName,collectionName,done){
	this.mongo = require('mongodb');
	this.mongoose = require('mongoose');

	// Connect to the database
	if (typeof(collectionName)=='undefined'){
		console.error('@Mentor requires a collectionName to continue.');
		return null;
	}


	// Initialize the data model
	initDatabase.apply(this,[dbName, collectionName, done]);

}


// ------------------------ mentor property definitions ---------------------------

mentor.prototype.lessons = [];
mentor.prototype.hidden_markov = {};



// ------------------------ mentor method definitions -----------------------------

function initDatabase(dbName,collectionName,done){
	var self = this;
	self.collectionName = collectionName;
	try {
		self.db = require('mongoskin').db('mongodb://localhost/'+dbName);

		if (typeof(self.db)=='undefined'){
			console.error('Unable to initialize mongoskin'.red);
			return false;
		}

		// Load the lessons from mongo
		self.db.collection(collectionName).findOne(function(err, lesson){  
			if(err) { 
				self.clear();
				console.error('Unable to connect to mongo!')
				return console.error(err);  
			}

			// Load the lesson to the class memory
			console.log('@Mentor is reading the lesson from the DB:');
			if (lesson == null) {
				console.log('... No lessons found');
				self.clear();
				done();
			}
			else{
				self.lessons = lesson;
				console.log('@Mentor reads the lessons successfully ❤'.green);

				// Create and let the HMM learn from the loaded lessons now
				self.learn();

				done();
			}
		});  
	}
	catch (e) {
		// Error occurs!
		console.error('OMG. Unable to connect to the server.'.red);
		console.error(e);
		return false;
	}

}

/* DEPRECATED */
/*
function initDatabase_Mongoose(dbName,collectionName,done) {
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
	        if(err) { 
	        	console.log('Unable to find a record'.red);
	        	self.clear();
	        	return console.error(err);  
	        }
	        
	        // Load the lesson to the class memory
	        console.log('@Mentor is reading the lesson from the DB:');
	        if (lesson == null) {
	        	console.log('... No lessons found');
	        	self.clear();
	        	done();
	        }
	        else{
	        	self.lessons = lesson;
	        	console.log('@Mentor reads the lessons successfully ❤'.green);

	        	// Create and let the HMM learn from the loaded lessons now
	        	self.learn();

	        	done();
	        }
	    })  
	  
	});
}
*/

mentor.prototype.clear = function(){
	// DEPRECATED:
	// this.lessons = new this.LessonModel();

	// Clear the lesson object
	this.lessons = { 
		labels: [],
	       states: [] 
	       /*{
	       	state: null,
			p: 0,
			trans: {},
			obs: {}
	       }*/
	};

	console.log('Flush lessons:');
	console.log(this.lessons);
	return this;
}


mentor.prototype.learn = function(){
	return learnHMMLib.apply(this); // Switch to [learnHMMInternal] if desire
}

var learnHMMLib = function(){
	// Using the NPM hmm module
	this.hmm = require('hmm');

	// Initialize our beloved Hidden Markov Model from the lessons
	var _initialProbs = [this.lessons.states.map(function(el){
		return el.p;
	})];
	var _transitions = [];
	var _observations = [];

	// List state names & label names
	var _states = this.lessons.states.map(function(el){return el.state.toString()});
	var _labels = this.lessons.labels;

	var self = this;

	// Make up transition matrices & emissions (observations)
	_states.forEach(function(stateName){

		var s = self.lessons.states.filter(function(u){ return u.state==stateName})[0];

		var _rowTrans = [];
		var _rowObserv = [];

		_states.forEach(function(_s){
			if (s.trans.hasOwnProperty(_s))
				_rowTrans.push(s.trans[_s]);
			else
				_rowTrans.push(0.0);
		});

		_labels.forEach(function(_lb){
			if (s.obs.hasOwnProperty(_lb))
				_rowObserv.push(s.obs[_lb]);
			else
				_rowObserv.push(0.0);
		});

		_transitions.push(_rowTrans);
		_observations.push(_rowObserv);
	});

	// TAOTODO:DEBUG: Display the Hidden Markov initial arguments
	console.log('states: '.cyan +_states.toString());
	console.log('labels: '.cyan +_labels.toString());
	console.log('trans: '.cyan );
	console.log(_transitions);
	console.log('obs: '.cyan);
	console.log(_observations);
	console.log('initial: '.cyan);
	console.log(_initialProbs);

	this.hidden_markov = new this.hmm(_transitions, _observations, _initialProbs);
}

/* DEPRECATED */
/*
mentor.prototype.save_mongoose = function(){
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
*/

mentor.prototype.save = function(){
	console.log('@Mentor is saving the lessons...'.green);

	// Save all lessons to mongo
	if (typeof(this.lessons)=='undefined' || this.lessons.length<=0){
		console.error('@Mentor does not have lessons to save.');
		return false;
	}

	// Remove the existing recordset(s)
	this.db.collection(this.collectionName).remove({});

	// Insert the current recordset
	this.db.collection(this.collectionName).insert(this.lessons, function(err,result){
		if (err) {
			console.error('Error saving the lessons'.red);
			console.error(err);
		}
		else{
			console.log('@Mentor saved the lessons ❤'.green);
		}

	});
}

mentor.prototype.showLessons = function(){

	// Print JSON output now
	return this.lessons;

	/*
	// Display registered labels
	var result = ['Labels : ' + this.lessons.labels.join(' / ') ];

	// Display registered states
	this.lessons.states.forEach(function(s){
		result.push('State : ' + s.state + ' p=' + s.p.toFixed(2));
		
		// Transition
		Object.keys(s.trans).forEach(function(t){
			if (_MENTOR_RESERVED_KEY==t || _MONGO_RESERVED_KEYS.indexOf(t)>-1){
				return;
			}

			result.push('   ===> transition to ['+t+'] p=' + s.trans[t].toFixed(2));
		});
		
		// Observed as
		Object.keys(s.obs).forEach(function(ob){
			if (_MENTOR_RESERVED_KEY==ob || _MONGO_RESERVED_KEYS.indexOf(ob)>-1){
				return;
			}

			result.push('   >>>> observed as ['+ob+'] p=' + s.obs[ob].toFixed(2));
		});
	});

	return result; */
}


mentor.prototype.setState = function(state){
	// Replace the existing one if any
	try{
		var self = this;
		this.lessons.states.forEach(function(el,i){
			if (el.state == state.state){
				// State found, set the initial probability now
				el.p = state.p;
				self.lessons.states.set(i, el);
				throw BreakException;
			}
		});

		// No existing state found
		// Add a fresh new state
		this.lessons.states.push({
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
				self.lessons.states.set(i, el); // TAOTODO: This is no longer applicable
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

				// "From" state found 
				// Add an observation
				el.obs[emission.label.toString()] = emission.p;
				self.lessons.states.set(i, el);
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

		if (!equal(sumOfTrans,1.0) && !equal(sumOfTrans,0.0)){
			callbackEach.apply(self,['Total sum of transition prob from ['+s.state+'] not equal to 0 or 1 (got '+sumOfTrans.toFixed(2)+')']);
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

		if (!equal(sumOfObs,1.0) && !equal(sumOfObs,0.0)){
			callbackEach.apply(this,['Total sum of the emission prob of [' +s.state +'] not equal to 0 or 1 (got '+sumOfObs.toFixed(2)+')']);
		}
	});

	if (sumStateProb!=1.0){
		callbackEach.apply(this,['Total sum of initial state prob not equal 1 (got '+sumStateProb.toFixed(2)+')']);
		result &= 0;
	}



	return result;
}




mentor.prototype.testHMM = function(){
	var _labels = ['easy','medium','hard'];
	var _states = ['passed','failed'];

	_transitions = [[0.8, 0.2],
					[0.8, 0.2]];

	_observations = [[0.9, 0.03, 0.07],
					 [0.4, 0.4, 0.2]];

 	_initialProbs = [[0.5, 0.5]];

	_myHMM = new this.hmm(_transitions, _observations, _initialProbs);

	// Test possible observaitions from the underlying states
	var testObservations = [
		[['easy','easy','easy'],['passed','passed','passed']],
		[['easy','easy','medium'],['passed','passed','passed']],
		[['hard','medium','easy'],['failed','passed','passed']],
		[['hard','medium','easy'],['failed','failed','passed']],
		[['hard','easy'],['failed','passed']]
	];

	testObservations.forEach(function (element){
		var label = element[0].map(function(a){return _labels.indexOf(a)});
		var seq = element[1].map(function(a){return _states.indexOf(a)});
		var p = _myHMM.getProbabilityOfStateSequenceForObservations(seq, label); // seq, observations
		
		var seq_optimal = _myHMM.getOptimalStateSequencesOfObservations(label);
		var seq_optimal_names = seq_optimal.map(function(s){return element[1][s]});
		var p0 = _myHMM.getProbabilityOfStateSequenceForObservations(seq_optimal, label); // seq, observations

		console.log('Test observations: ' + element[0].join(' ==> '));
 		console.log('     Guess if the root cause : ' +  element[1].join(' ==> ') + ' at @prob = ' + (p*100).toFixed(0) + '%');
 		console.log('     Most probable shoule be : ' + seq_optimal_names.join(' ==> ') + ' at @prob = ' + (p0*100).toFixed(0)+ '%');
	});


	return true;
}


mentor.prototype.likelihood = function(labelChain, stateChain){
	var self = this;
	var stateNames = self.lessons.states.map(function(el){return el.state}); 
	var _labels = labelChain.map(function(el){return self.lessons.labels.indexOf(el)});
	var _states = stateChain.map(function(el){return stateNames.indexOf(el)});
	return self.hidden_markov.getProbabilityOfStateSequenceForObservations(_states, _labels);
}


mentor.prototype.predictFromLabels = function (labelChain){
	if (labelChain.length==0){
		console.error('@Mentor needs a non-empty chain of labels.'.red);
		return {states:[], p:0};
	}

	var self = this;
	var labels = labelChain.map(function(el){return self.lessons.labels.indexOf(el)});

	var optimalStateSequence = self.hidden_markov.getOptimalStateSequencesOfObservations(labels);
	var prob = self.hidden_markov.getProbabilityOfStateSequenceForObservations(optimalStateSequence, labels);

	var stateList = self.lessons.states.map(function(s){return s.state});

	return {
		states: optimalStateSequence.map(function(s){return stateList[s]}),
		p: prob
	}
}

// Export the module for Node.js use
exports.mentor = mentor;
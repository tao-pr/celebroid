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
	.predictLabel([labels])					==> Predict what's the next label
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


mentor = function(dbName,collectionName){
	this.mongo = require('mongodb');
	this.mongoose = require('mongoose');

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
mentor.prototype.hidden_markov = {};



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
	        	self.lessons = lesson;
	        	console.log('@Mentor reads the lessons successfully ❤'.green);

	        	// Create and let the HMM learn from the loaded lessons now
	        	self.learn();
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
	return mentor.learnHMMLib.apply(this); // Switch to [learnHMMInternal] if desire
}

mentor.learnHMMLib = function(){
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
	console.log('states: '+_states.toString());
	console.log('labels: '+_labels.toString());
	console.log('trans: ');
	console.log(_transitions);
	console.log('obs: ');
	console.log(_observations);
	console.log('initial: ');
	console.log(_initialProbs);

	this.hidden_markov = new this.hmm(_transitions, _observations, _initialProbs);
}

/*
mentor.learnHMMInternal = function(){
	// Using the ./lib/hmm module

	// Convert lessons to the HMM's compatible input raw data
	var _labels = this.lessons.labels.map(function(lbl){return lbl.toString()});
	var _states = this.lessons.states.map(function(el){return el.state.toString()});
	var _finalstate = this.lessons.states[this.lessons.states.length-1].state.toString();
	var _initialProbs = this.lessons.states.map(function(el){
		return el.p;
	});

	var _transitions = {};
	var _emissions = {};

	// Set the transitions & emissions
	this.lessons.states.forEach(function(s){
		var transObj = {};
		var emissObj = {};

		// Serialize the transition object
		Object.keys(s.trans).forEach(function(t){
			if (_MONGO_RESERVED_KEYS.indexOf(t)>-1 || _MENTOR_RESERVED_KEY==t){
				return;
			}

			transObj[t.toString()] = s.trans[t.toString()];
		});

		// Serialize the emission object
		Object.keys(s.obs).forEach(function(e){
			if (_MONGO_RESERVED_KEYS.indexOf(e)>-1 || _MENTOR_RESERVED_KEY==e){
				return;
			}

			emissObj[e.toString()] = s.obs[e.toString()];
		});


		_transitions[s.state.toString()] = transObj;
		_emissions[s.state.toString()] = emissObj;
	});

	// TAOTODO:DEBUG Display HMM construction arguments
	console.log(_states);
	console.log(_finalstate);
	console.log(_labels); 
	console.log(_initialProbs);
	console.log(_transitions);
	console.log(_emissions);

	this.hidden_markov = new this.hmm(_states, _finalstate, _labels, _initialProbs, _transitions, _emissions);
	// this.hidden_markov.print();
	console.log('Hidden Markov Model now learned from the lessons ❤'.green);
}
*/

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
	var result = ['Labels : ' + this.lessons.labels.join(' / ') ];

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
				self.lessons.states.set(i, el);
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

				self.lessons.states.set(i, el);
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

	// Test observations
	var testObservations = [
		[['easy','easy','easy'],['passed','passed','passed']],
		[['easy','easy','medium'],['passed','passed','passed']],
		[['hard','medium','easy'],['failed','passed','passed']]
	];

	testObservations.forEach(function (element){
		var label = element[0].map(function(a){return _labels.indexOf(a)});
		var seq = element[1].map(function(a){return _states.indexOf(a)});
		var p = _myHMM.getProbabilityOfStateSequenceForObservations(seq, label); // seq, observations
		console.log('Prob of '+element[1].join('-->')+' to be observed as '+element[0].join('-->')+' = '+p.toFixed(3));
	});

	return true;
}

/*
mentor.prototype.predictLabel = function(chain){
	if (chain.length==0) {
		console.error('@Mentor needs a non-empty chain of labels to predict'.red);
		return [];
	}

	if (this.hidden_markov==null || this.hidden_markov.length==0){
		console.error('@Mentor needs to compose the hidden Markov model first to continue');
		return [];
	}

	console.log('Predict chain: ' + chain.join(' ==> '));
	var confident = this.hidden_markov.viterbiApproximation(chain);
	var resultPath = this.hidden_markov.optimalStateSequence(chain);
	console.log('Prediction confidence : ' + confident);

	return resultPath;
}

mentor.prototype.testHMM = function(){
	// Using local ./lib/hmm module
	var _model = new this.hmm(
		['red','yellow','green'],		// States
		'green',						// Final state
		['go','stop'],					// Observation symbols (emissions)
		{'red':0.8,'green':0.2},		// Initial state probabilities
		{								// State transitions
			'go':{'go':0.3,'stop':0.7},
			'stop':{'stop':0.8,'go':0.2}
		},
		{								// State emissions
			'red':{'stop':0.9,'go':0.1},
			'yellow':{'stop':0.5,'go':0.5},
			'green':{'go':1}
		}
	);

	var testSequence = ['go','stop','go'];

	// Probability of states 
	console.log('Generation prob: '+_model.generationProbability(testSequence));

	// Viterbi sequence
	console.log('Viterbi path: '+_model.optimalStateSequence(testSequence).join(' => '));

	resp.send('see the console');

}
*/

// Export the module for Node.js use
exports.mentor = mentor;
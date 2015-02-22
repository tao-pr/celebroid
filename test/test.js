
var assert = require('assert');


// COMMON TEST HELPER FUNCTIONS ==================================

var hasProperty = function(prop){ 
  return this.hasOwnProperty(prop);
}


// MENTOR TEST KIT STARTS HERE ==========================================
describe('@MENTOR TEST', function(){
  var mentor = require('../lib/mentor.js');
  var _mentor = {};
  before(function(done){
    _mentor = new mentor.mentor('test','celebroid_test',done);
  });

  describe('After Mentor creation',function(){
    it('should have lessons object initialized',function(done){
      assert.equal('object', typeof(_mentor.lessons.states));
      assert.equal('object',typeof(_mentor.lessons.labels))
      done();
    });

    it('should have [LessonModel] defined',function(done){
      var hasLessonModel = hasProperty.apply(_mentor,['LessonModel']);
      assert.equal(true, hasLessonModel);
      done();
    });

    it('should have [db] defined',function(done){
      var hasDB = hasProperty.apply(_mentor,['db']);
      assert.equal(true, hasDB);
      done();
    });

    after(function(done){
      // Prepare the initial lessons
      prepareLessons.apply(_mentor);
      // Display the lessons
      console.log('Now test lessons have been initialized.');
      console.log(_mentor.showLessons());
      done();
    })
  });
  
  // Post-test
  describe("After lessons assignment", function(){
    it("should have lessons pre-initialized",function(done){
      assert.equal(3, _mentor.lessons.labels.length);
      done();
    });

    it('should pass the lessons verification', function(){
      assert.equal(true, _mentor.verifyLessons());
    });
  });


  describe('Compile model', function(){

    it('compile the model should pass without errors',function(done){
      assert.doesNotThrow(function(){_mentor.learn()});
      done();
    });
  });


  describe('Prediction test', function(){
    it('wins 3 matches in a row should not be a defensive play', function(done){
      var _bestPlayPattern = _mentor.predictFromLabels(['win','win','win']);
      assert.equal(-1,_bestPlayPattern.states.indexOf('defensive'));
      done();
    });

    it('loses 6 matches in a row should not be an attacking play',function(done){
      var _bestPlayPattern = _mentor.predictFromLabels(['loss','loss','loss','loss','loss','loss']);
      assert(_bestPlayPattern.states.filter(function(a){ return a == 'attacking'}).length<2);
      done();
    });

    it('defensive play should be less likely to win than dominant', function(done){
      var _straightWins = ['win','win'];
      var _defensivePlay = _mentor.likelihood(_straightWins,['defensive','defensive']);
      var _dominantPlay = _mentor.likelihood(_straightWins,['dominant','dominant']);
      assert(_defensivePlay < _dominantPlay);
      done();
    });

  });
});


// BAYESIAN TEST KIT STARTS HERE ========================================
describe('@BAYES TEST', function(){
  // TAOTODO: Compose the test kit
})

function prepareLessons(){
  this.setLabels(['win','draw','loss']);
  this.setState({state: 'dominant',p: 0.2});
  this.setState({state: 'attacking',p: 0.3});
  this.setState({state: 'balanced',p: 0.4});
  this.setState({state: 'defensive',p: 0.1});

  this.setTransition({from: 'dominant', to: 'dominant', p:0.4});
  this.setTransition({from: 'dominant', to: 'attacking', p:0.4});
  this.setTransition({from: 'dominant', to: 'balanced', p:0.2});

  this.setTransition({from: 'attacking', to: 'dominant', p:0.3});
  this.setTransition({from: 'attacking', to: 'attacking', p:0.5});
  this.setTransition({from: 'attacking', to: 'balanced', p:0.1});
  this.setTransition({from: 'attacking', to: 'defensive', p:0.1});

  this.setTransition({from: 'balanced', to: 'balanced', p:0.7});
  this.setTransition({from: 'balanced', to: 'attacking', p:0.1});
  this.setTransition({from: 'balanced', to: 'defensive', p:0.2});

  this.setTransition({from: 'defensive', to: 'defensive', p:0.7});
  this.setTransition({from: 'defensive', to: 'balanced', p:0.3});

  this.setEmission('dominant',{label:'win', p:0.7});
  this.setEmission('dominant',{label:'draw', p:0.15});
  this.setEmission('dominant',{label:'loss', p:0.15});

  this.setEmission('attacking',{label:'win', p:0.5});
  this.setEmission('attacking',{label:'draw', p:0.25});
  this.setEmission('attacking',{label:'loss', p:0.25});

  this.setEmission('balanced',{label:'win', p:0.33});
  this.setEmission('balanced',{label:'draw', p:0.33});
  this.setEmission('balanced',{label:'loss', p:0.34});

  this.setEmission('defensive',{label:'win', p:0.1});
  this.setEmission('defensive',{label:'draw', p:0.6});
  this.setEmission('defensive',{label:'loss', p:0.3});

  console.log('set lessons completed');
}
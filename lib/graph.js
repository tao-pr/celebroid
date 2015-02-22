//-------------------------------------------------
//  Graph
//  Developed & managed by StarColon Projects
//  Aimed to be utilized with [node.js] app
//  EST: February 2015
//      http://starcolon.com/
//-------------------------------------------------
// Graph structure implementation


// Main graph
var graph = function(){
	this.nodes = []; // Nodes are all private to itself

}

// Sub-class : node
graph.node = function(nodename,p){
	this.name = nodename; // N
	this.p = p; // p(N)
}


// ---------- Graph definitions -------------------
//	addNode(nodename)				=> Add a new node to the graph
//  removeNode(nodename)			=> Remove a node from the graph
//  node(nodename,callback)			=> Find the node (or also apply a function on it if found)
//  size()							=> Returns the number of the nodes
// 	given(nodename)					=> Returns the node (analogous to calling `node`)


// ---------- Node definitions --------------------
//	probability()					=> node probabilty getter
//  probability(val)				=> node probability setter

graph.node.prototype.name = null; // Name of the node
graph.node.prototype.adjacency = []; // List of the node adjacencies
graph.node.prototype.probability = function(p){ if (typeof(p)!='undefined') this.p = p; else return this.p;};

//-------------------------------------------------


// Fundamental function definition
var BreakException = function(){}

//-------------------------------------------------


graph.prototype.addNode = function(nodename){
	// Replace the existing one if any
	var self = this;

	// Node duplication check
	if (self.nodes.filter(function(n){ return n.name == nodename}).length>0){
		return this;
	}

	self.nodes.push(new graph.node(nodename));
	return self;
}


graph.prototype.removeNode = function (nodename){
	var i = this.nodes.length;
	var self = this;
	while (--i>=0){
		// Remove the node from the graph
		if (self.nodes[i].name == nodename){
			self.nodes.splice(i,1);
			return self;
		}
	}
	// No node has been recently removed
	return this;
}


graph.prototype.node = function (nodename,action){
	var self = this;
	var matched_node = null;
	try{
		self.nodes.forEach(function(n,i){
			if (n.name===nodename){
				if (typeof(action)=='function'){
					action.apply(self,[n]);
				}
				matched_node = self.nodes[i];
				throw BreakException;
			}
		});
	}
	catch (e){
		// Break exception should get caught here
		if (e != BreakException) throw e;
		return matched_node;
	}

	// No node found
	return null;
}


graph.prototype.given = graph.prototype.node;


graph.prototype.size = function(){
	return this.nodes.length;
}


// Export the module
exports.graph = graph;


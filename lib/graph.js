//-------------------------------------------------
//  Graph
//  Developed & managed by StarColon Projects
//  Aimed to be utilized with [node.js] app
//  EST: February 2015
//      http://starcolon.com/
//-------------------------------------------------
// Graph structure implementation


var graph = function(){
	this.nodes = []; // Nodes are all private to itself
}

var node = function(nodename){
	this.name = nodename;
}


// ---------- Class definitions -------------------
// graph.prototype.addNode(node)				
// graph.prototype.removeNode(nodename)
// graph.prototype.node()

node.prototype.name = null; // Name of the node
node.prototype.adjacency = []; // List of the node adjacencies

//-------------------------------------------------

graph.prototype.addNode = function(node){
	// Replace the existing one if any
	var self = this;
	if (self.nodes.filter(function(n){n.name==node.name}).length>0){
		try{
			self.nodes.forEach(function(el,i){
				if (el.name==node.name){
					// Node found, now completely replace the old one
					self.nodes[i] = node;
					throw BreakException;
				}
			});
		}
		catch (e){
			// Break should get trapped into here
			if (e != BreakException) throw e;
		}
	}
	else{
		self.nodes.push(node);
	}
	return self;
}


graph.prototype.removeNode = function (nodename){
	this.nodes = this.nodes.filter(function(n){
		return n.name != nodename.n
	});
	return this;
}


graph.prototype.node = function (nodename,action){
	var matches = this.nodes.filter(function(n){
		return n.name == nodename.name
	});

	if (matches.length==0)
		return null;
	else{
		if (typeof(action)=='function'){
			action.apply(matches[0]);
		}
		return matches[0];
	}

}


// Export the module
exports.graph = graph;


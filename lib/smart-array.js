//-------------------------------------------------
//  Smarter Array
//  Developed & managed by StarColon Projects
//  Aimed to be utilized with [node.js] app
//  EST: Janurary 2015
//      http://starcolon.com/
//-------------------------------------------------


Array.prototype.addOrReplace = function(elem,key){
	var self = toObject(this);
	// Add a pair element to the array
	// if the key already exists, it replaces the old one
	for (var k in self){
		if (self[k][key] == elem[key]){
			// Replace the existing element
			self[k] = elem;
			return self;
		}
	}

	// No existing key, add a new one
	self.push(elem);
	return self;
}


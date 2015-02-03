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


Array.prototype.select = function(keyname){
	return Array.prototype.map(function(el){
		if (el.hasOwnProperty(keyname.toString()))
			return null;
		else
			return el[keyname.toString()];
	});
}


// From [{a:something001, b:somevalue}, {a:something002, b:somevalue}]
// to {something001: somevalue, something002: somevalue}
Array.prototype.toProperty = function(keyname,valuename){
	var obj = {};

	this.forEach(function(el){
		var key = el[keyname.toString()];
		var val = el[valuename.toString()];

		// Add the property to the resultant object
		// TAOTODO:
	});

	return obj;
}


define([], function(){
	var parseQueryString = function(){
		var queryString = location.hash.substring(1).split("&");
		
		var queryObject = {};
		
		_.each(queryString, function(entry){
			var entryComponents = entry.split("=")
			queryObject[entryComponents[0]] = entryComponents[1];
		});
		return queryObject;
	};
	return parseQueryString;
});
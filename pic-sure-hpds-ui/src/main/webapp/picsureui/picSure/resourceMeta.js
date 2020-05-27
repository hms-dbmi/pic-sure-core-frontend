define(["text!../settings/settings.json"], function(settings){
	var sets = JSON.parse(settings);
    return sets.resources.map(resource => Object.assign(resource, {
        "queryPath" : resource.basePath + "query",
        "queryStatusBasePath" : resource.basePath + "query/" + resource.uuid + "/status",
        "queryResultBasePath" : resource.basePath + "query/" + resource.uuid + "/result",
        "findPath" : resource.basePath + "search/" + resource.uuid,
        "subQueries" : resource.subQueries
    }));
});
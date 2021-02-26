define(["jquery", "underscore", "text!../settings/settings.json", "overrides/ontology",
        "picSure/search"],
		function($, _, settings, overrides,
                 search) {

    if (!sessionStorage.getItem("session")) {
        return {};
    }
    var allConcepts;
    var allInfoColumns;

    var counts = function(tree, allConcepts, crossCounts) {
        var total = 0;
        var folderCount = 0;
        _.each(tree.children, function(child) {
            var count = counts(child, allConcepts, crossCounts);
            if (count > 0) {
                folderCount++;
            }
            total += count;
            child.text = child.text.replace(/(\([0-9]+ [a-z]+\))+$/, "");
            if (count == 0) {
                if (crossCounts !== undefined) {
                    child.text += " (" + crossCounts[child.id] + " observations in subset)";
                } else {
                    child.text += " (" + allConcepts.results.phenotypes[child.id].observationCount + " observations)";
                }
            } else {
                child.text += " (" + (count == 0 ? 1 + " concept)" : count + " concepts)");
            }
        });
        return total + tree.children.length - folderCount;
    }

    var autocomplete = search.query;

    var loadAllConceptsDeferred = function(){
    	allConceptsDeferred = $.Deferred();
	    search.dictionary("\\", function(allConceptsRetrieved) {
	        allConcepts = allConceptsRetrieved;
	        allConceptsDeferred.resolve();
	    }, {}, JSON.parse(settings).picSureResourceId);
	    return allConceptsDeferred;
    }
    
    var allInfoColumnsQuery = {
        resourceUUID: JSON.parse(settings).picSureResourceId,
        query: {
            expectedResultType: "INFO_COLUMN_LISTING"
        }
    };
    
    var loadAllInfoColumnsDeferred = function() {

    	allinfoColumnsDeferred = $.Deferred();
        $.ajax({
            url: window.location.origin + "/picsure/query/sync",
            type: 'POST',
            headers: {
                "Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token
            },
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(allInfoColumnsQuery),
            success: function(response) {
                allInfoColumns = response;
                allinfoColumnsDeferred.resolve();
            }.bind(this),
            error: function(response) {
                console.log("error retrieving info columns");
                console.log(response);
            }.bind(this)
        });
        
        return allinfoColumnsDeferred;
    }
    
    var allConceptsLoaded = overrides.loadAllConceptsDeferred ? overrides.loadAllConceptsDeferred() : loadAllConceptsDeferred();
    var allInfoColumnsLoaded = overrides.loadAllInfoColumnsDeferred ? overrides.loadAllInfoColumnsDeferred() : loadAllInfoColumnsDeferred();
    
    var cachedTree;
    
    var tree = function(consumer, crossCounts) {
        if (cachedTree) {
            counts(cachedTree, allConcepts, crossCounts);
            consumer(cachedTree);
        } else {
            // build query scope
            // scope filters export tree to authorized root nodes for applications using the the query scope feature.
            var scope = [];

            var scopes = JSON.parse(sessionStorage.getItem("session")).queryScopes;
            if(scopes != undefined){
                scopes.forEach(function(item, index) {
                    if ( item.length < 2 || !item.startsWith("\\")) {
                        scope.push(item);
                    } else if(item.length < 3){
                        scope.push(item.substr(1,2));
                    } else {
                        scope.push(item.substr(1,item.length - 2));
                    };
                });
            }

            allConceptsLoaded.then(function() {
                var tree = {
                    text: "data",
                    state: {
                        open: true,
                        disabled: true
                    },
                    children: []
                };

		      _.each(_.keys(allConcepts.results.phenotypes), function(concept) {
                    var segments = concept.split("\\");
                    var currentNode =  tree;
                    
                    if(segments.length > 0) {
                        // if criteria:
                        // 1.  currently the business rule for query scope is if untrue we will show all nodes
                        // 2.  if using scope check if root node is in queryScope for user
                        // 3.  all nodes starting with an underscore are also shown.
                        if(!scope || scope.length === 0 || scope.includes(segments[1]) || segments[1].startsWith("_")) {

                            for (var x = 1; x < segments.length - 1; x++) {
                                var index_of_child = _.findIndex(currentNode.children, function(child) {
                                    return child.text === segments[x];
                                })
                                if (currentNode.children[index_of_child] === undefined) {
                                    var newNode = {
                                        id: segments.slice(0, x + 1).join("\\") + "\\",
                                        text: segments[x],
                                        children: []
                                    };
                                    currentNode.children.push(newNode);
                                }
                                currentNode = currentNode.children[(index_of_child===-1) ? currentNode.children.length-1 : index_of_child];
                            }

                        } 
                       

                    }

               });

                counts(tree, allConcepts, crossCounts);
                consumer(tree);
                cachedTree = JSON.parse(JSON.stringify(tree));
            });
        }
    };

    var allInfoColumns_ = function() {
        return allInfoColumns;
    };

    var allConcepts_ = function() {
        return allConcepts;
    };

    return {
        tree: tree,
        // todo: is this being used anywhere?
        allConcepts: allConcepts_,
        allInfoColumns: allInfoColumns_,
        allInfoColumnsLoaded: allInfoColumnsLoaded
    };
});

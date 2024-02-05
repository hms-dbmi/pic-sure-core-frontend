define(["jquery", "underscore", "picSure/settings", "overrides/ontology",
        "picSure/search"],
		function($, _, settings, overrides,
                 search) {

    var instance;
    var allConcepts, allInfoColumns, hybridNodes;

    let infoColumnsTimeout = overrides.infoColumnsTimeout ? overrides.infoColumnsTimeout : 60000;

    var loadAllConceptsDeferred = function(){
    	allConceptsDeferred = $.Deferred();
	    search.dictionary("\\", function(allConceptsRetrieved) {
	        allConcepts = allConceptsRetrieved;
	        var nodes = Object.keys(allConcepts.results.phenotypes);
	        hybridNodes = [];
	        for (i = 0; i < nodes.length - 1; i++) {
                var cur = nodes[i];
                var nex = nodes[i + 1];
                if (nex.startsWith(cur)) {
                    hybridNodes.push(cur);
                }
            };
	        allConceptsDeferred.resolve();
	    }, {}, settings.picSureResourceId);
	    return allConceptsDeferred;
    }

    var allInfoColumnsQuery = {
        resourceUUID: settings.picSureResourceId,
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

        if (infoColumnsTimeout) {
            setTimeout(function() {
                allinfoColumnsDeferred.reject();
            }, infoColumnsTimeout);
        }

        return allinfoColumnsDeferred;
    }

    var allInfoColumns_ = function() {
        return allInfoColumns;
    };

    var allConcepts_ = function() {
        return allConcepts;
    };

    var getHybridNodes = function() {
        return hybridNodes;
    };

    var getInstance_ = function() {
        if (typeof instance === 'undefined') {
            var allConceptsLoaded = overrides.loadAllConceptsDeferred ? overrides.loadAllConceptsDeferred() : loadAllConceptsDeferred();
            var allInfoColumnsLoaded = overrides.loadAllInfoColumnsDeferred ? overrides.loadAllInfoColumnsDeferred() : loadAllInfoColumnsDeferred();
            instance = {
                allConcepts: allConcepts_,
                allConceptsLoaded: allConceptsLoaded,
                allInfoColumns: allInfoColumns_,
                allInfoColumnsLoaded: allInfoColumnsLoaded,
                getHybridNodes: getHybridNodes
            }
            return instance;
        }
        return instance;
    };

    return {
        getInstance: getInstance_
    };
});

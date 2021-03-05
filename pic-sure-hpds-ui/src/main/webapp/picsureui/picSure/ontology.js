define(["jquery", "underscore", "text!../settings/settings.json", "overrides/ontology",
        "picSure/search"],
		function($, _, settings, overrides,
                 search) {

    var instance;
    var allConcepts, allInfoColumns;

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

    var allInfoColumns_ = function() {
        return allInfoColumns;
    };

    var allConcepts_ = function() {
        return allConcepts;
    };

    var getInstance_ = function() {
        if (typeof instance === 'undefined') {
            var allConceptsLoaded = overrides.loadAllConceptsDeferred ? overrides.loadAllConceptsDeferred() : loadAllConceptsDeferred();
            var allInfoColumnsLoaded = overrides.loadAllInfoColumnsDeferred ? overrides.loadAllInfoColumnsDeferred() : loadAllInfoColumnsDeferred();
            instance = {
                allConcepts: allConcepts_,
                allConceptsLoaded: allConceptsLoaded,
                allInfoColumns: allInfoColumns_,
                allInfoColumnsLoaded: allInfoColumnsLoaded
            }
            return instance;
        }
        return instance;
    };

    return {
        getInstance: getInstance_
    };
});

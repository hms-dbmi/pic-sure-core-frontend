define(["jquery", "underscore", "picSure/settings", "overrides/ontology",
        "picSure/search"],
		function($, _, settings, overrides,
                 search) {

    var instance;
    var allConcepts, allInfoColumns;

    let infoColumnsTimeout = overrides.infoColumnsTimeout ? overrides.infoColumnsTimeout : 60000;

    var loadAllConceptsDeferred = function(){
    	allConceptsDeferred = $.Deferred();
	    search.dictionary("\\", function(allConceptsRetrieved) {
	        allConcepts = allConceptsRetrieved;
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

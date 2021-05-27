define(["common/transportErrors", "overrides/search"], function(transportErrors, overrides){

    /*
     * A function that takes a PUI that is already split on forward slash and returns
     * the category value for that PUI.
     */
    var extractCategoryFromPui = function(puiSegments) {
        return puiSegments[0];
    };

    /*
     * A function that takes a PUI that is already split on forward slash and returns
     * the parent value for that PUI.
     */
    var extractParentFromPui = function(puiSegments) {
        return puiSegments[puiSegments.length - 2];
    };

    var searchCache = {};
    
    //provide default sort implementation
    var orderResults = (overrides && overrides.orderResults) ? overrides.orderResults : function(searchterm, a, b){
        var indexOfTerm = a.value.toLowerCase().indexOf(searchterm) - b.value.toLowerCase().indexOf(searchterm);
        var differenceInLength = a.value.length - b.value.length;
        return (indexOfTerm * 1000) + differenceInLength;
    }

    var mapResponseToResult = function(query, response, incomingQueryScope) {
        //lowercase for consistent comparisons
        query = query.toLowerCase();
        var queryScope = [];
        if (incomingQueryScope && incomingQueryScope.length > 0) {
            queryScope = incomingQueryScope;
        }

        var result = {};
        result.suggestions = [];
        result.suggestions = _.filter(result.suggestions.concat(_.map(response.phenotypes,
            entry => {
                var puiSegments = entry.name.split("\\").filter(function(seg) {
                    return seg.length > 0;
                });
                return {
                    value: puiSegments[puiSegments.length - 1],
                    data: entry.name,
                    category: extractCategoryFromPui(puiSegments).replace(/[\W_]+/g, "_"),
                    tooltip: entry.name,
                    columnDataType: entry.categorical ? "CATEGORICAL" : "CONTINUOUS",
                    metadata: entry,
                    parent: extractParentFromPui(puiSegments)
                };
            }).concat(_.map(response.genes, entry => {
//            var puiSegments = ["Genes", entry.name]; //entry.name.split("\\").filter(function(seg){return seg.length > 0;});
            return {
                value: entry.name,
                data: entry.name,
                category: "Genes",
                tooltip: entry.name,
                columnDataType: "VARIANT",
                metadata: entry,
                parent: "Chromosome " + entry.chr
            };
        })).concat(_.map(_.keys(response.info), key => {
            var entry = response.info[key];
            entry.name = entry.description;
            return {
                value: entry.description,
                data: entry.description,
                category: key,
                tooltip: entry.description,
                columnDataType: "INFO",
                metadata: entry,
                parent: "Variant Info"
            };
        })).sort(function(a, b) {
        	return orderResults(query, a, b);
        })),function(element){
            if(queryScope.length == 0) {
                return true;
            }
            var scopeMatches = function(value){
                return element.metadata.name.startsWith(value) || element.category.startsWith(value);
            }
            //Check to see if element name (aka path) starts with any value defined in the query scope
            return _.some(queryScope, scopeMatches);
        });

        return result;
    };

    return {
        dictionary: function(query, success, error, resourceUUID) {
            return $.ajax({
                url: window.location.origin + '/picsure/search/' + resourceUUID,
                data: JSON.stringify({
                    "query": query
                }),
                headers: {
                    "Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token
                },
                contentType: 'application/json',
                type: 'POST',
                success: success,
                error: error,
                dataType: "json"
            });
        },
        execute: function(query, done, resourceUUID) {
            return this.dictionary(
                query,
                function(response) {
                    var result = mapResponseToResult(query, response.results, 
                        (overrides.queryScopeUUID===resourceUUID ? JSON.parse(sessionStorage.getItem("session")).queryScopes : []));
                    searchCache[query.toLowerCase()] = result;
                    done(result);
                }.bind({
                    done: done
                }),
                function(response) {
                    if (!transportErrors.handleAll(response, "error in search.dictionary")) {
                        searchCache[query.toLowerCase()] = [];
                        done({
                            suggestions: []
                        });
                    }
                },
                resourceUUID
            )
        }
    };
});

define(["underscore", "text!../settings/settings.json", "picSure/resourceMeta"], function(_, settings, resourceMeta) {
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

    var mapResponseToResult = function(query, response, incomingQueryScope) {
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
        }).sort(function(a, b) {
            var indexOfTerm = a.value.toLowerCase().indexOf(query) - b.value.toLowerCase().indexOf(query);
            var differenceInLength = a.value.length - b.value.length;
            //                      return indexOfTerm == 0 ? indexOfTerm + differenceInLength : indexOfTerm;
            return (indexOfTerm * 1000) + differenceInLength;
        }).concat(_.map(response.genes, entry => {
            var puiSegments = ["Genes", entry.name]; //entry.name.split("\\").filter(function(seg){return seg.length > 0;});
            return {
                value: entry.name,
                data: entry.name,
                category: "Genes",
                tooltip: entry.name,
                columnDataType: "VARIANT",
                metadata: entry,
                parent: "Chromosome " + entry.chr
            };
        }).sort(function(a, b) {
            var indexOfTerm = a.value.toLowerCase().indexOf(query) - b.value.toLowerCase().indexOf(query);
            var differenceInLength = a.value.length - b.value.length;
            //			return indexOfTerm == 0 ? indexOfTerm + differenceInLength : indexOfTerm;
            return (indexOfTerm * 1000) + differenceInLength;
        })).concat(_.map(_.keys(response.info), key => {
            var entry = response.info[key];
            return {
                value: entry.description,
                data: entry.description,
                category: key,
                tooltip: entry.description,
                columnDataType: "INFO",
                metadata: entry,
                parent: "Variant Info"
            };
        }).sort(function(a, b) {
            var indexOfTerm = a.value.toLowerCase().indexOf(query) - b.value.toLowerCase().indexOf(query);
            var differenceInLength = a.value.length - b.value.length;
            //			return indexOfTerm == 0 ? indexOfTerm + differenceInLength : indexOfTerm;
            return (indexOfTerm * 1000) + differenceInLength;
        }))),function(element){return queryScope.length>0 ? queryScope.includes(element.category):true});
       
        return result;
    };

    var searchCache = {};

    var dictionary = function(query, success, error) {
        return $.ajax({
            url: window.location.origin + '/picsure/search/' + JSON.parse(settings).picSureResourceId,
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
    };
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

    var autocomplete = function(query, done) {

        return dictionary(
            query,
            function(response) {
                $.ajax({
                    url: window.location.origin + "/psama/user/me",
                    type: 'GET',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json',
                    success: function(meResponse){
                        var result = mapResponseToResult(query, response.results, meResponse.queryScopes);
                        searchCache[query.toLowerCase()] = result;
                        done(result);
                    }.bind(this),
                    error: function(response){
                        console.log("error retrieving user info");
                        console.log(response);
                        if (response.status === 401) {
                            sessionStorage.clear();
                            window.locaion = "/";
                        }
                    }.bind(this)
                });
            }.bind({
                done: done
            }),
            function(response) {
                if (response.status === 401) {
                    sessionStorage.clear();
                    window.location = "/";
                } else {
                    searchCache[query.toLowerCase()] = [];
                    done({
                        suggestions: []
                    });
                }
            })
    }.bind({
        resourceMeta: resourceMeta
    });

    var allConcepts;
    var allInfoColumns;

    var allConceptsLoaded = $.Deferred();

    var allInfoColumnsLoaded = $.Deferred();

    dictionary("\\", function(allConceptsRetrieved) {
        allConcepts = allConceptsRetrieved;
        allConceptsLoaded.resolve();
    });

    var allInfoColumnsQuery = {
        resourceUUID: JSON.parse(settings).picSureResourceId,
        query: {

            expectedResultType: "INFO_COLUMN_LISTING"
        }
    };

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
            allInfoColumnsLoaded.resolve();
        }.bind(this),
        error: function(response) {
            console.log("error retrieving info columns");
            console.log(response);
        }.bind(this)
    });

    var cachedTree;

    var tree = function(consumer, crossCounts) {
        if (cachedTree) {
            counts(cachedTree, allConcepts, crossCounts);
            consumer(cachedTree);
        } else {
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
                    var currentNode = tree;
                    for (var x = 1; x < segments.length - 1; x++) {
                        if (currentNode.children[_.findIndex(currentNode.children, function(child) {
                            return child.text.includes(segments[x])
                        })] === undefined) {
                            var newNode = {
                                id: segments.slice(0, x + 1).join("\\") + "\\",
                                text: segments[x],
                                children: []
                            };
                            currentNode.children.push(newNode);
                        }
                        currentNode = currentNode.children[_.findIndex(currentNode.children, function(child) {
                            return child.text.includes(segments[x])
                        })];
                    }
                });

                counts(tree, allConcepts, crossCounts);
                consumer(tree);
                cachedTree = JSON.parse(JSON.stringify(tree));
            });
        }
    };

    var verifyPathsExist = function(paths, targetResource, done) {
        if (!localStorage.getItem("id_token")) {
            done(false);
            var resolved = $.Deferred();
            resolved.resolve();
            return resolved;
        }
        return $.ajax({
            url: window.location.origin + '/picsure/search/' + JSON.parse(settings).picSureResourceId,
            headers: {
                "Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token
            },
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                "query": paths[0]
            }),
            success: function(response) {
                done(true);
            },
            error: function(response) {
                done(false);
            }
        });
    };

    var allInfoColumns_ = function() {
        return allInfoColumns;
    };

    var allConcepts_ = function() {
        return allConcepts;
    };

    return {
        dictionary: dictionary,
        tree: tree,
        autocomplete: autocomplete,
        verifyPathsExist: verifyPathsExist,
        allConcepts: allConcepts_,
        allInfoColumns: allInfoColumns_,
        allInfoColumnsLoaded: allInfoColumnsLoaded
    };
});
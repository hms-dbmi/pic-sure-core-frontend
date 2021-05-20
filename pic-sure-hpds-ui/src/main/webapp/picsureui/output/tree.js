define(["jquery", "underscore", "text!../settings/settings.json", "overrides/ontology",
        "picSure/ontology"],
    function($, _, settings, overrides,
             ontology) {
        var cachedTree;
        var tree = function(consumer, crossCounts) {
            if (cachedTree) {
                counts(cachedTree, ontology.getInstance().allConcepts(), crossCounts);
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

                ontology.getInstance().allConceptsLoaded.then(function() {
                    let allConcepts = ontology.getInstance().allConcepts();
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

        return {
            // rename update tree or something
            updateTree: tree
        }

    }
);
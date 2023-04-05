define([
    'backbone',
    'handlebars',
    'jstree',
    'picSure/settings',
    'text!output/package-data-view.hbs',
    'overrides/package-data-view',
    'output/tree',
    'common/spinner',
    'overrides/outputPanel',
], function (BB, HBS, jstree, settings, view, overrides, tree, spinner, outputOverride,) {
    let triggerDownload = function (response) {
        const responseDataUrl = URL.createObjectURL(new Blob([response], { type: "octet/stream" }));
        $("#download-btn", this.$el).off('click');
        $("#download-btn", this.$el).removeAttr("href");
        $("#download-btn", this.$el).attr("href", responseDataUrl);
        // User already clicked, so we need to trigger the download
        $("#download-btn", this.$el)[0]?.click();
    }
    let PicsureDialog = BB.View.extend({
        initialize: function (opts) {
            this.template = HBS.compile(view);
            this.model = opts.model;
            this.settings = settings;
            this.selectedFields = [];
            this.updateQuery(opts.query);
            this.queryButtonLabel = settings.queryButtonLabel;
        },
        events: {
            "click #prepare-btn": "prepare",
            "click #copy-queryid-btn" : "copyQueryId",
            "change": "updateEstimations",
        },
        copyQueryId: function () {
            navigator.clipboard.writeText(document.getElementById('queryid-span').value);
            document.getElementById('copy-queryid-btn').innerText = "Copied!";
        },
        downloadData: function(queryId){
            if (overrides.downloadData) {
                overrides.downloadData(queryId);
                return;
            }
            $.ajax({
                url: window.location.origin + "/picsure/query/" + queryId + "/result",
                type: 'POST',
                headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                contentType: 'application/json',
                dataType: 'text',
                data: "{}", //TODO: check if needed
                success: function(response){
                    triggerDownload(response);
                }.bind(this),
                error: function(response){
                    console.error("error preparing download : ");
                    console.dir(response);
                }.bind(this)
            })
        }.bind(this),
        prepare: function () {
            if (overrides.prepare) {
                overrides.prepare();
                return;
            }
            $("#download-btn", this.$el).removeAttr("href");
            $("#download-btn", this.$el).off();
            $("#download-btn", this.$el).addClass('hidden');
            let query = JSON.parse(JSON.stringify(this.query));

            query.query.fields = _.filter($('#concept-tree', this.$el).jstree().get_selected(), function (child) {
                var children = $('#concept-tree', this.$el).jstree().get_node(child).children;
                return children == undefined || children.length === 0;
            }.bind(this));
            
            query.query.expectedResultType = "DATAFRAME";

            //we can only clear the unused consents AFTER adding the fields
            if (outputOverride.updateConsentFilters) {
                outputOverride.updateConsentFilters(query, this.settings);
            }

            this.updateEstimations(query);

            if (!this.settings.queryExportType || this.settings.queryExportType == "EXPORT_IMMEDIATE") {
                this.querySync(query);
            } else if (this.settings.queryExportType == "EXPORT_ASYNC") {
                let deferredQueryId = $.Deferred();
                let self = this;
                this.queryAsync(query, deferredQueryId);
                $.when(deferredQueryId).then(function (queryUUID) {
                    $("#download-btn", this.$el).removeClass('hidden');
                    $("#download-btn", this.$el).one('click', function () {
                        self.downloadData(queryUUID);
                    }.bind(self));
                    $("#copy-queryid-btn", this.$el).removeClass('hidden');
                });
            } else {  //EXPORT_DISABLED
                let deferredQueryId = $.Deferred();
                this.queryAsync(query, deferredQueryId)
                $.when(deferredQueryId).then(function () {
                    $("#copy-queryid-btn", this.$el).removeClass('hidden');
                });
            }
        },
        updateQueryFields: function () {
            let query = JSON.parse(JSON.stringify(this.query));

            query.query.fields = _.filter($('#concept-tree', this.$el).jstree().get_selected(), function (child) {
                var children = $('#concept-tree', this.$el).jstree().get_node(child).children;
                return children == undefined || children.length === 0;
            }.bind(this));

            //we can only clear the unused consents AFTER adding the fields
            if (outputOverride.updateConsentFilters) {
                outputOverride.updateConsentFilters(query, this.settings);
            }
            return query;
        },
        queryAsync: function (query, promise) {
            if (overrides.queryAsync) {
                overrides.queryAsync(query, promise);
                return;
            }
            /*
             * This will send a query to PICSURE to evaluate and execute; it will not return results.  Use downloadData to do that.
             */
            let queryUUID = null;
            let queryUrlFragment = '';
            let interval = 0;

            (function updateStatus() {
                $.ajax({
                    url: window.location.origin + "/picsure/query" + queryUrlFragment,
                    type: 'POST',
                    headers: { "Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token },
                    contentType: 'application/json',
                    dataType: 'text',
                    data: JSON.stringify(query),
                    success: function (response) {
                        respJson = JSON.parse(response);
                        queryUUID = respJson.picsureResultId;
                        //update UI elements
                        $('#resource-id-display', this.$el).html("<input type='text' id='queryid-span' value='"+queryUUID+"' readonly /><button id='copy-queryid-btn' class='btn btn-default'>Copy Dataset Id</button> Status: " + respJson.status);
                        // Break out of this process if there is no data, or the query is over
                        if (!respJson.status || respJson.status == "ERROR") { //TODO: handle when export is disabled
                            return;
                        } else if (respJson.status == "AVAILABLE") {
                            //resolve any waiting functions.
                            promise && promise.resolve(queryUUID);
                            return;
                        }

                        //check again, but back off at 2, 4, 6, ... 30 second (max) intervals
                        interval = Math.min(interval + 2000, 30000);
                        //hit the status endpoint after the first request
                        queryUrlFragment = "/" + queryUUID + "/status";
                        setTimeout(updateStatus, interval);
                    },
                    error: function (response) {
                        $('#resource-id-display', this.$el).html("Error running query, Please see logs");
                        console.log("error preparing async download: ");
                        console.dir(response);
                    }
                });
            }());
        },
        querySync: function (query) {
            if (overrides.querySync) {
                overrides.querySync(query);
                return;
            }
            spinner.small(
                $.ajax({
                    url: window.location.origin + "/picsure/query/sync",
                    type: 'POST',
                    headers: { "Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token },
                    contentType: 'application/json',
                    dataType: 'text',
                    data: JSON.stringify(query),
                    success: function (response) {
                        triggerDownload(response);
                    }.bind(this),
                    error: function (response) {
                        console.error("Error preparing download : ");
                        console.dir(response);
                    }.bind(this)
                }), 
                "#download-spinner", 
                "download-spinner",
            );
        },
        updateEstimations: function (query) {
            if (overrides.updateEstimations) {
                overrides.updateEstimations(query);
                return;
            }
            let queryToUse = query || this.query;
            $('#total-patients', this.el).text(this.model.get('totalPatients') + " Patients");
            let totalVariables = (Object.keys(queryToUse.query.categoryFilters)?.length + 
                                    queryToUse.query.anyRecordOf?.length +
                                    Object.keys(queryToUse.query.numericFilters)?.length + 
                                    queryToUse.query.requiredFields?.length) || 0;
            totalVariables += queryToUse.query?.fields?.length || 0;
            totalVariables += queryToUse.query?.requiredFields?.length || 0;
            $('#total-variables').text(totalVariables + " Variables");
            $('#estimated-data-points').text(this.model.get('totalPatients') * totalVariables + " Estimated Data Points");
        },
        updateQuery: function (query) {
            if (overrides.updateQuery) {
                overrides.updateQuery(query, this);
                return;
            }
            if (!query) { return; }

            this.query = query;
            this.selectedFields = _.uniq(this.selectedFields.concat(query.query.requiredFields)
                .concat(query.fields)
                .concat(_.keys(query.query.categoryFilters))
                .concat(_.keys(query.query.numericFilters)));
        },
        queryChangedCallback: function () {
            if (overrides.queryChangedCallback) {
                overrides.queryChangedCallback(this);
                return;
            }
            this.query = this.updateQueryFields();
            this.updateEstimations(this.query);
        },
        render: function () {
            this.$el.html(this.template(this));
            if (this.model.get('queryRan')) {
                    // this.totalVariables = this.totalPatients * dataSelection.selectedFields.length;
                    // this.dataSelection = new dataSelection({ query: JSON.parse(JSON.stringify(this.model.baseQuery)) });
                    // $('#concept-tree-div', this.$el).append(this.dataSelection.$el);
                    spinner.small(
                        // tree.updateTree builds a tree of json objects, and passes it to the innter function which is
                        // responsible for rendering the elements.
                        tree.updateTree(function(tree){
                            //order export tree according to settings category selections
                            //look up the category indices once, so we don't spin through this array constantly.
                            let catIndices = {};
                            _.each(this.settings.categorySearchResultList, function(category, index){
                                catIndices[category] = index;
                            });
                            tree.children = _.sortBy(tree.children, function(entry){
                                //entry.id starts and ends with '\'
                                entryId = entry.id.substr(1, entry.id.length - 2); 
                                catIndex = catIndices[entryId];
                                
                                return (catIndex == undefined ? 999 : catIndex)  + entry.text;
                            });
                            let conceptTree = $("#concept-tree", this.$el).jstree({
                                core:{
                                    data:tree,
                                },
                                "checkbox" : {
                                    "keep_selected_style" : false
                                },
                                "plugins":["checkbox"]
                            });
                                $("#concept-tree", this.$el).on("before_open.jstree", function(event, data){
                                    let query = JSON.parse(JSON.stringify(this.query)) || {};
                                    query.query.expectedResultType="CROSS_COUNT";
                                    query.query.crossCountFields = _.filter(data.node.children, function(child){
                                        let children = $('#concept-tree', this.$el).jstree().get_node(child).children;
                                        return children == undefined || children.length === 0;
                                    }.bind(this));
                                    
                                    //we can only clear the unused consents AFTER adding the fields
                                    if(outputOverride.updateConsentFilters){
                                        outputOverride.updateConsentFilters(query, this.settings);
                                    }
                                    
                                    $.ajax({
                                        url: window.location.origin + "/picsure/query/sync",
                                        type: 'POST',
                                        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                                        contentType: 'application/json',
                                        data: JSON.stringify(query),
                                        success: function(crossCounts){
                                            _.each(query.query.crossCountFields, function(child){
                                                let childNode = $('#concept-tree', this.$el).jstree().get_node(child);
                                                childNode.text = childNode.text.replace(/<b\>.*<\/b>/,'') +  " <b>(" + crossCounts[child] + " observations in subset)</b>";
                                                $('#concept-tree', this.$el).jstree().redraw_node(child);
                                            }.bind(this));
                                            $('#prepare-btn', this.$el).removeClass('hidden');
                                        }.bind(this),
                                        error: console.log
                                    });
                                }.bind(this));
                                _.delay(function(){$('.jstree-node[aria-level=1] > .jstree-icon').click();}, 750);
                            }.bind(this)), 
                            "#download-spinner",
                            "download-spinner"
                    );
                    $("#concept-tree").on("changed.jstree", function (e, data) {
                        this.queryChangedCallback();
                    }.bind(this));
            }
            this.updateEstimations();
            overrides.renderExt && overrides.renderExt(this);
        }
    });
    return PicsureDialog;
});
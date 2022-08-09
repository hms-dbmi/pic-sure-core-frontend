define(["jquery", "datatables", "backbone", "handlebars", "text!output/variantTable.hbs", "text!options/modal.hbs", "picSure/settings",
        "common/config", "common/spinner"],
    function($, datatables, BB, HBS, variantTableTemplate, modalTemplate, settings,
             config, spinner){

        let variantExplorerView = BB.View.extend({
            initialize: function() {
                this.variantTableTemplate = HBS.compile(variantTableTemplate);
                this.modalTemplate = HBS.compile(modalTemplate);
            },
            events: {
                "click #variant-data-btn" : "variantdata"
            },
            updateQuery: function(query) {
                this.baseQuery = query;
                this.displayVariantButton();
            },
            displayVariantButton: function() {
                var showVariantButton = false;
                if(this.baseQuery && this.baseQuery.query.variantInfoFilters.length > 0){
                    _.each(this.baseQuery.query.variantInfoFilters, function(variantHolder){
                        if(Object.keys(variantHolder.categoryVariantInfoFilters).length != 0 ||
                            Object.keys(variantHolder.numericVariantInfoFilters).length != 0){
                            showVariantButton = true;
                        }
                    });
                }
                if (showVariantButton) {
                    $("#variant-data-container").removeClass("hidden");
                } else {
                    $("#variant-data-container").addClass("hidden");
                }
            },
            // Check the number of variants in the query and show a modal if valid.
            variantdata: function(event){
                // make a safe deep copy of the incoming query so we don't modify it
                var query = JSON.parse(JSON.stringify(this.baseQuery));

                //this query type counts the number of variants described by the query.
                query.query.expectedResultType="VARIANT_COUNT_FOR_QUERY";

                this.renderComplete = $.Deferred();
                spinner.medium(this.renderComplete, "#variant-spinner", "spinner-medium spinner-medium-center ");

                $.ajax({
                    url: window.location.origin + "/picsure/query/sync",
                    type: 'POST',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json',
                    data: JSON.stringify(query),
                    dataType: 'text',
                    success: function(response){

                        //If there are fewer variants than the limit, show the modal
                        maxVariantCount =  settings.maxVariantCount ? settings.maxVariantCount : 1000;

                        let responseJson = JSON.parse(response);

                        if( responseJson.count == 0 ){
                            this.showBasicModal("Variant Data", "No Variant Data Available.  " + responseJson.message);
                            this.renderComplete.resolve();
                        } else if( responseJson.count <= maxVariantCount ){
                            this.showVariantDataModal(query);
                        } else {
                            this.showBasicModal("Variant Data", "Too many variants!  Found " + responseJson.count + ", but cannot display more than " + maxVariantCount + " variants.")
                            this.renderComplete.resolve();
                        }
                    }.bind(this),
                    error: function(response){
                        this.render();
                        console.log("ERROR: " + response);
                        this.renderComplete.resolve();
                    }.bind(this)
                });
            },
            showBasicModal: function(titleStr, content){
                $("#modal-window").html(this.modalTemplate({title: titleStr}));
                $(".close").click(function(){
                    $("#modalDialog").hide();
                });
                $("#modalDialog").show();
                $(".modal-body").html(content);
                this.render();
            },
            //this takes a parsed query object and gets a list of variant data & zygosities from the HPDS
            //and creates a modal table to display it
            showVariantDataModal: function(query){

                //we expect an object that has already been parsed/copied from the model.
                //update the result type to get the variant data
                if (settings.variantExplorerStatus === config.VariantExplorerStatusEnum.enabled) {
                    query.query.expectedResultType="VCF_EXCERPT";
                } else if (settings.variantExplorerStatus === config.VariantExplorerStatusEnum.aggregate) {
                    query.query.expectedResultType="AGGREGATE_VCF_EXCERPT";
                } else {
                    throw "variantExplorerStatus must be enabled or aggregate";
                }

                $.ajax({
                    url: window.location.origin + "/picsure/query/sync",
                    type: 'POST',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json',
                    data: JSON.stringify(query),
                    dataType: 'text',
                    success: function(response){

                        //default message if no data
                        variantHtml = "No Variant Data Available"
                        output = {};

                        if(response.length > 0){
                            //each line is TSV
                            var lines = response.split("\n");

                            headers = lines[0].split("\t");
                            output["headers"] = headers;
                            output["variants"] = []
                            //read the tsv lines into an object that we can sent to Handlebars template
                            for(i = 1; i < lines.length; i++){
                                values = lines[i].split("\t");
                                if(values.length > 1){
                                    output["variants"].push(values);
                                }
                            }
                        }

                        //lines ends up with a trailing empty object; strip that and the header row for the count
                        $("#modal-window").html(this.modalTemplate({title: "Variant Data: " + (lines.length - 2) + " variants found"}));
                        $(".close").click(function(){
                            $("#modalDialog").hide();
                        });

                        $("#modalDialog").show();
                        $(".modal-body").css("overflow-x", "scroll")
                        $(".modal-body").html("<style scoped>th{width:auto !important; }</style> <table id='vcfData' class='display stripe' ></table>");

                        $('#vcfData').DataTable( {
                            data: output["variants"],
                            columns: _.map(output['headers'],(header)=>{
                                return {title:header }
                            }),columnDefs: [
                                {
                                    targets: '_all',
                                    className: 'dt-center'
                                },
                                {
                                    targets: [6, 11],
                                    visible: false
                                }
                              ],
                            deferRender: true,
                            drawCallback: function(){
                                this.renderComplete.resolve();
                            }.bind(this)
                        } );

                        //now add a handy download link!
                        $(".modal-header").append("<a id='variant-download-btn'>Download Variant Data</a>");
                        responseDataUrl = URL.createObjectURL(new Blob([response], {type: "octet/stream"}));
                        $("#variant-download-btn", $(".modal-header")).off('click');
                        $("#variant-download-btn", $(".modal-header")).attr("href", responseDataUrl);
                        $("#variant-download-btn", $(".modal-header")).attr("download", "variantData.tsv");
                        this.render();
                        this.renderComplete.resolve();
                    }.bind(this),
                    error: function(response){
                        console.log("ERROR: " + response);
                        this.render();
                        this.renderComplete.resolve();
                    }.bind(this)
                });
            },
            render: function() {
            }
        });

        return {
            View: variantExplorerView,
            Model: BB.Model.extend({	})
        }
    }
);

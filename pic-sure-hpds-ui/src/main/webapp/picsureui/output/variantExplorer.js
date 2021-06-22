define(["jquery", "backbone", "handlebars", "text!output/variantTable.hbs", "text!options/modal.hbs", "picSure/settings",
        "text!output/variantExplorer.hbs"],
    function($, BB, HBS, variantTableTemplate, modalTemplate, settings,
             variantExplorerTemplate){

        let variantExplorerView = BB.View.extend({
            initialize: function() {
                this.template = HBS.compile(variantExplorerTemplate);
                this.variantTableTemplate = HBS.compile(variantTableTemplate);
                this.modalTemplate = HBS.compile(modalTemplate);
            },
            events: {
                "click #variant-data-btn" : "variantdata"
            },
            updateQuery: function(query) {
                this.baseQuery = query;

                if(this.baseQuery && this.baseQuery.query.variantInfoFilters.length > 0){
                    _.each(this.baseQuery.query.variantInfoFilters, function(variantHolder){
                        if(Object.keys(variantHolder.categoryVariantInfoFilters).length != 0 ||
                            Object.keys(variantHolder.numericVariantInfoFilters).length != 0){
                            $("#variant-data-btn").removeClass("hidden");
                            return false;
                        }
                    });
                }
            },
            // Check the number of variants in the query and show a modal if valid.
            variantdata: function(event){
                this.render();
                // make a safe deep copy of the incoming query so we don't modify it
                var query = JSON.parse(JSON.stringify(this.baseQuery));

                //this query type counts the number of variants described by the query.
                query.query.expectedResultType="VARIANT_COUNT_FOR_QUERY";

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

                        //responseJson = JSON.parse(response);
                        // use this to test vs current udn production
                        var responseJson = {count: parseInt(response)}

                        if( responseJson.count == 0 ){
                            this.showBasicModal("Variant Data", "No Variant Data Available.  " + responseJson.message);
                        } else if( responseJson.count <= maxVariantCount ){
                            this.showVariantDataModal(query);
                        } else {
                            this.showBasicModal("Variant Data", "Too many variants!  Found " + responseJson.count + ", but cannot display more than " + maxVariantCount + " variants.")
                        }
                    }.bind(this),
                    error: function(response){
                        this.render();
                        console.log("ERROR: " + response);
                    }
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
                query.query.expectedResultType="VCF_EXCERPT";

                $.ajax({
                    url: window.location.origin + "/picsure/query/sync",
                    type: 'POST',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json',
                    data: JSON.stringify(query),
                    dataType: 'text',
                    success: function(response){
    //				 		console.log(response);

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
                                variantData = {};
                                values = lines[i].split("\t");
                                for(j=0; j < values.length; j++){
                                    variantData[headers[j]] = values[j];
                                }
                                output["variants"].push(variantData);
                            }
                            //render the template!
                            variantHtml = this.variantTableTemplate(output);
                        }

                        //lines ends up with a trailing empty object; strip that and the header row for the count
                        $("#modal-window").html(this.modalTemplate({title: "Variant Data: " + (lines.length - 2) + " variants found"}));
                        $(".close").click(function(){
                            $("#modalDialog").hide();
                        });
                        $("#modalDialog").show();
                        $(".modal-body").html(variantHtml);

                        //now add a handy download link!
                        $(".modal-header").append("<a id='variant-download-btn'>Download Variant Data</a>");
                        responseDataUrl = URL.createObjectURL(new Blob([response], {type: "octet/stream"}));
                        $("#variant-download-btn", $(".modal-header")).off('click');
                        $("#variant-download-btn", $(".modal-header")).attr("href", responseDataUrl);
                        $("#variant-download-btn", $(".modal-header")).attr("download", "variantData.tsv");
                        this.render();
                    }.bind(this),
                    error: function(response){
                        console.log("ERROR: " + response);
                        this.render();
                    }
                });
            },
            render: function() {
                this.$el.html(this.template({}));
            }
        });

        return {
            View: variantExplorerView,
            Model: BB.Model.extend({	})
        }
    }
);
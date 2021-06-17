define(["jquery", "output/dataSelection", "text!output/outputPanel.hbs", "picSure/ontology", "backbone", "handlebars",
		"overrides/outputPanel", "common/transportErrors", "common/config", "text!output/variantTable.hbs",
		"text!options/modal.hbs", "picSure/settings"],
		function($,  dataSelection, outputTemplate, ontology, BB, HBS,
				 overrides, transportErrors, config, variantTableTemplate,
				 modalTemplate, settings){

	var outputModel = overrides.modelOverride ? overrides.modelOverride : BB.Model.extend({	});

	const variantExplorerStatus = overrides.variantExplorerStatus ? overrides.variantExplorerStatus : config.VariantExplorerStatusEnum.disabled;

	var outputView = overrides.viewOverride ? overrides.viewOverride : 
		BB.View.extend({
			ontology: ontology,
			initialize: function(){
				this.template = HBS.compile(overrides.outputTemplate ? overrides.outputTemplate : outputTemplate);
				overrides.renderOverride ? this.render = overrides.renderOverride.bind(this) : undefined;
				overrides.update ? this.update = overrides.update.bind(this) : undefined;
				HBS.registerHelper("outputPanel_obfuscate", function(count){
					if(count < 10 && false){
						return "< 10";
					} else {
						return count;
					}
				});

				if (variantExplorerStatus === config.VariantExplorerStatusEnum.enabled) {
					this.variantTableTemplate = HBS.compile(variantTableTemplate);
					this.modalTemplate = HBS.compile(modalTemplate);
				}
			},
			
			events:{
				"click #select-btn": "select",
				"click #variant-data-btn" : "variantdata",
			},
			select: function(event){
				if(this.model.get("queryRan")){
					if( !this.dataSelection){
						this.dataSelection = new dataSelection({query:JSON.parse(JSON.stringify(this.model.baseQuery))});
						$("#select-btn").hide();
						$("#concept-tree-div",this.$el).append(this.dataSelection.$el);
					} else {
						this.dataSelection.updateQuery(this.model.baseQuery);
					}
					this.dataSelection.render();
				}
			},
			totalCount: 0,
			tagName: "div",
			dataCallback: function(result){
				//default function to update a single patient count element in the output panel
				
				var count = parseInt(result);
				this.model.set("totalPatients", count);
				this.model.set("queryRan", true);
				this.model.set("spinning", false);
				
				$("#patient-count").html(count);  
                //and update the data selection panel
				if( this.dataSelection){
					this.dataSelection.updateQuery(this.model.baseQuery);
					this.dataSelection.render();
				}

				if(variantExplorerStatus === config.VariantExplorerStatusEnum.enabled
					&& this.model.baseQuery
					&& this.model.baseQuery.query.variantInfoFilters.length > 0){
					_.each(this.model.baseQuery.query.variantInfoFilters, function(variantHolder){
						if(Object.keys(variantHolder.categoryVariantInfoFilters).length != 0 ||
							Object.keys(variantHolder.numericVariantInfoFilters).length != 0){
							$("#variant-data-btn").removeClass("hidden");
							return false;
						}
					});
				}

    			this.delegateEvents();
			},
			errorCallback: function(message){
				//clear some status flags and make sure we inform the user of errors
				this.model.set("totalPatients", '-');
				this.model.set("spinning", false);
				this.model.set("queryRan", true);
				this.render();
				$("#patient-count").html(message);
			},
			runQuery: function(incomingQuery){
				if(overrides.runQuery){
					overrides.runQuery(this, incomingQuery, this.dataCallback.bind(this), this.errorCallback.bind(this));
				} else {
					//use the default logic
					var query = JSON.parse(JSON.stringify(incomingQuery)); //make a safe copy
					this.model.baseQuery = query;
					$.ajax({
					 	url: window.location.origin + "/picsure/query/sync",
					 	type: 'POST',
					 	headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
					 	contentType: 'application/json',
					 	data: JSON.stringify(query),
	  				 	success: function(response, textStatus, request){
	  				 		this.dataCallback(response, request.getResponseHeader("resultId"));
	  						}.bind(this),
					 	error: function(response){
							if (!transportErrors.handleAll(response, "Error while processing query")) {
								response.responseText = "<h4>"
									+ overrides.outputErrorMessage ? overrides.outputErrorMessage : "There is something wrong when processing your query, please try it later, if this repeats, please contact admin."
									+ "</h4>";
						 		this.errorCallback(response.responseText);
							}
						}.bind(this)
					});
				}
			},
			render: function(){
				this.$el.html(this.template(this.model.toJSON()));
				if(this.dataSelection){
					this.dataSelection.setElement($("#concept-tree-div",this.$el));
					this.dataSelection.render();
				}
			},
			// Check the number of variants in the query and show a modal if valid.
			variantdata: function(event){
				if (variantExplorerStatus === config.VariantExplorerStatusEnum.enabled) {
					this.model.set('spinning', true);
					this.render();
					// make a safe deep copy of the incoming query so we don't modify it
					var query = JSON.parse(JSON.stringify(this.model.baseQuery));

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

							responseJson = JSON.parse(response);
							// use this to test vs current udn production
							//var responseJson = {count: parseInt(response)}

							if( responseJson.count == 0 ){
								this.showBasicModal("Variant Data", "No Variant Data Available.  " + responseJson.message);
							} else if( responseJson.count <= maxVariantCount ){
								this.showVariantDataModal(query);
							} else {
								this.showBasicModal("Variant Data", "Too many variants!  Found " + parseInt(response) + ", but cannot display more than " + maxVariantCount + " variants.")
							}
						}.bind(this),
						error: function(response){
							this.model.set('spinning', false);
							this.render();
							console.log("ERROR: " + response);
						}
					});
				}
			},

			showBasicModal: function(titleStr, content){
				$("#modal-window").html(this.modalTemplate({title: titleStr}));
				$(".close").click(function(){
					$("#modalDialog").hide();
				});

				$("#modalDialog").show();
				$(".modal-body").html(content);
				this.model.set('spinning', false);
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
						this.model.set('spinning', false);
						this.render();
					}.bind(this),
					error: function(response){
						console.log("ERROR: " + response);
						this.model.set('spinning', false);
						this.render();
					}
				});

			}
		});
	
	return {
			View : outputView,
			Model: (overrides.modelOverride ? overrides.modelOverride : outputModel)
	}
});
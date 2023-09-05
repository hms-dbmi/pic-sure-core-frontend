define(["jquery", "underscore", "text!output/outputPanel.hbs", "picSure/ontology", "backbone", "handlebars",
		"overrides/outputPanel", "common/transportErrors", "common/config", "picSure/settings", "output/variantExplorer",
		"common/modal", "filter/genomic-filter-view", "output/package-data-view", "overrides/output/variantExplorer"],
		function($, _, outputTemplate, ontology, BB, HBS,
				 overrides, transportErrors, config,  settings, variantExplorer, modal, genomicFilterView,
				 packageDataView, variantExplorerOverride,
        ){
	var defaultModel = BB.Model.extend({
		defaults: {
			totalPatients : 0,
			spinnerClasses: "spinner-medium spinner-medium-center ",
			spinning: false,
			resources : {}
		}
	});

	var outputModel = overrides.modelOverride ? overrides.modelOverride : defaultModel;
	var variantExplorer = variantExplorerOverride.apply ? variantExplorerOverride : variantExplorer;

	var outputView = overrides.viewOverride ? overrides.viewOverride : 
		BB.View.extend({
			ontology: ontology,
			initialize: function(){
				this.template = HBS.compile(overrides.outputTemplate ? overrides.outputTemplate : outputTemplate);
				overrides.renderOverride ? this.render = overrides.renderOverride.bind(this) : undefined;
				overrides.update ? this.update = overrides.update.bind(this) : undefined;
				HBS.registerHelper("outputPanel_obfuscate", function(count){
					if(count < 10){
						return "< 10";
					} else {
						return count;
					}
				});
			},
			events:{
				"click #select-btn": "select",
				"click #genomic-filter-btn": "openGenomicFilter",
				"click #variant-data-btn" : "openVariantExplorer",
			},
			select: function(event){
				if(this.model.get("queryRan")){
					const title = overrides.titleOverride ? overrides.titleOverride : "Select Data for Export";
					const onClose = () => { $('#select-btn').focus(); };
					const options = { isHandleTabs: true, width: "70%" };
					const modalView = new packageDataView.View({
						modalSettings: { title, onClose, options },
						model: this.model,
						exportModel: new packageDataView.Model(),
						query: JSON.parse(JSON.stringify(this.model.baseQuery)),
					});
					modal.displayModal(modalView, title, onClose, options);
				}
			},
			queryRunning: function(){
				this.model.set('spinning', true);
				this.model.set('queryRan', false);
				this.render();
			},
			queryFinished: function(totalPatients){
				this.model.set("totalPatients", totalPatients);
				this.model.set('spinning', false);
				this.model.set('queryRan', true);
				this.render();
			},
			totalCount: 0,
			tagName: "div",
			dataCallback: function(result){
				//default function to update a single patient count element in the output panel
				
				var count = parseInt(result);
				this.queryFinished(count);
				
				$("#patient-count").html(count);

				if (this.variantExplorerView) {
					this.variantExplorerView.updateQuery(this.model.baseQuery);
				}

    			this.delegateEvents();
			},
			errorCallback: function(message){
				//clear some status flags and make sure we inform the user of errors
				this.queryFinished("-");
				$("#patient-count").html(message);
			},
			runQuery: function(incomingQuery){
				if(overrides.runQuery){
					overrides.runQuery(this, incomingQuery, this.dataCallback.bind(this), this.errorCallback.bind(this));
				} else {
					this.queryRunning();
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
			openGenomicFilter: function(){
				modal.displayModal(new genomicFilterView({el: $(".modal-body")}),
								  'Genomic Filter', 
								  () => { $('#genomic-filter-btn').focus(); },
								  { isHandleTabs: true }
				);
			},
			openVariantExplorer: function(){
				modal.displayModal(new variantExplorer({el: $(".modal-body"), query: this.model.baseQuery, errorMsg: undefined}),
								  'Variant Data', 
								  () => { $('#variant-data-btn').focus(); },
								  { isHandleTabs: true }
				);
			},
			displayVariantExplorerButton: function() {
				let showVariantButton = false;
                if(this.model.baseQuery && this.model.baseQuery.query.variantInfoFilters.length > 0){
                    _.each(this.model.baseQuery.query.variantInfoFilters, function(variantHolder){
                        if(Object.keys(variantHolder.categoryVariantInfoFilters).length != 0 ||
                            Object.keys(variantHolder.numericVariantInfoFilters).length != 0){
                            showVariantButton = true;
                        }
                    });
                }
				if (settings.variantExplorerStatus !== config.VariantExplorerStatusEnum.enabled
					&& settings.variantExplorerStatus !== config.VariantExplorerStatusEnum.aggregate) {
						showVariantButton = false;
					}
                if (showVariantButton) {
                    $("#variant-data-container").removeClass("hidden");
                } else {
                    $("#variant-data-container").addClass("hidden");
                }
			},
			render: function(){
				this.$el.html(this.template(this.model.toJSON()));
				this.displayVariantExplorerButton();
			}
		});
	
	return {
			View : outputView,
			Model: (overrides.modelOverride ? overrides.modelOverride : outputModel)
	}
});
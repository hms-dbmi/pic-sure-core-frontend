define(["jquery", "output/dataSelection", "text!output/outputPanel.hbs", "picSure/ontology", "backbone", "handlebars",
		"overrides/outputPanel", "common/transportErrors", "common/config", "picSure/settings", "output/variantExplorer",
		"common/modal", "filter/genomic-filter-view", "output/package-data-view"],
		function($,  dataSelection, outputTemplate, ontology, BB, HBS,
				 overrides, transportErrors, config,  settings, variantExplorer, modal, genomicFilterView, packageDataView){
	var defaultModel = BB.Model.extend({
		defaults: {
			totalPatients : 0,
			spinnerClasses: "spinner-medium spinner-medium-center ",
			spinning: false,
			resources : {}
		}
	});

	var outputModel = overrides.modelOverride ? overrides.modelOverride : defaultModel;

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
			},
			events:{
				"click #select-btn": "select",
				"click #genomic-filter-btn": "openGenomicFilter",
			},
			select: function(event){
				if(this.model.get("queryRan")){
					modal.displayModal(
						new packageDataView({model: this.model, query: JSON.parse(JSON.stringify(this.model.baseQuery)), modal: modal}), 
						overrides.titleOverride ? overrides.titleOverride : "Select Data for Export",
						()=>{$('#select-btn').focus();}, 
						{isHandleTabs: true}
					);
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
			render: function(){
				this.$el.html(this.template(this.model.toJSON()));

				if (settings.variantExplorerStatus === config.VariantExplorerStatusEnum.enabled
					|| settings.variantExplorerStatus === config.VariantExplorerStatusEnum.aggregate) {
					if (!this.variantExplorerView) {
						this.variantExplorerView = new variantExplorer.View(new variantExplorer.Model());
					}
					this.variantExplorerView.setElement($("#variant-data-container",this.$el));
					this.variantExplorerView.render();
				}
			}
		});
	
	return {
			View : outputView,
			Model: (overrides.modelOverride ? overrides.modelOverride : outputModel)
	}
});
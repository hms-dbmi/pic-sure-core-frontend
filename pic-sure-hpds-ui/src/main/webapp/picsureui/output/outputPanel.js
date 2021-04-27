define(["jquery", "text!../settings/settings.json", "output/dataSelection", "text!output/outputPanel.hbs","picSure/resourceMeta", "picSure/ontology", "backbone", "handlebars", "overrides/outputPanel", "common/transportErrors"],
		function($, settings, dataSelection, outputTemplate, resourceMeta, ontology, BB, HBS, overrides, transportErrors){

	var outputModelDefaults = {
			totalPatients : 0,
			spinnerClasses: "spinner-medium spinner-medium-center ",
			spinning: false,
			resources : {}
	};
	
	_.each(resourceMeta, (resource) => {
		
		//base resource first; this will be the 'all patients' or main query
		outputModelDefaults.resources[resource.id] = {
				id: resource.id,
				name: resource.name,
				patientCount: 0,
				spinnerClasses: "spinner-center ",
				spinning: false
		};
		
		//then check to see if we have sub queries for this resource - add those as 'resource' items as well
		_.each(resource.subQueries, (resource) => {
  			outputModelDefaults.resources[resource.id] = {
  					id: resource.id,
  					name: resource.name,
  					additionalPui: resource.additionalPui,
  					patientCount: 0,
  					spinnerClasses: "spinner-small spinner-small-center ",
  					spinning: false
  			};
		});
	});
	var outputModel = overrides.modelOverride ? overrides.modelOverride : BB.Model.extend({
		defaults: outputModelDefaults,
		spinAll: function(){
			this.set('spinning', true);
			this.set('queryRan', false);
  			_.each(this.get('resources'), function(resource){
  				resource.spinning=true;
  				resource.queryRan=false;
  			});
		}
	});

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
				"click #select-btn": "select"
			},
			select: function(event){
				
				this.model.set('spinning', true);
				if(!this.dataSelection){
					var query = JSON.parse(JSON.stringify(this.model.get("query")));
					
					if(!this.dataSelection){
						this.dataSelection = new dataSelection({query:JSON.parse(JSON.stringify(this.model.baseQuery))});
						$("#concept-tree-div",this.$el).append(this.dataSelection.$el);
					} else {
						this.dataSelection.updateQuery(query);
					}
					
					this.model.set("spinning", false);
					this.dataSelection.render();
				}
			},
			totalCount: 0,
			tagName: "div",
			update: function(incomingQuery){
				this.model.set("totalPatients",0);
				this.model.spinAll();
				
				//clear out the result count for resources/subqueries if we have no filters.  TODO: not sure why this is happening
				//we can't check for 'required fields' here because the subqueries may use that to drive some selection
	  			if (incomingQuery.query.requiredFields.length == 0
					&& _.keys(incomingQuery.query.numericFilters).length==0 
					&& _.keys(incomingQuery.query.categoryFilters).length==0
					&& _.keys(incomingQuery.query.variantInfoFilters).length==0
					&& _.keys(incomingQuery.query.categoryFilters).length==0) {
	  				_.each(this.model.get('resources'), function(picsureInstance){
		  					picsureInstance.id.patientCount = 0;
		  				}.bind(this));
		  			}
				
				this.render();
	
				
				//run a query for each resource 
				_.each(outputModelDefaults.resources, function(resource){
					// make a safe deep copy (scoped per resource) of the incoming query so we don't modify it
					var query = JSON.parse(JSON.stringify(incomingQuery));
					this.model.baseQuery = incomingQuery;
					
					query.resourceUUID = JSON.parse(settings).picSureResourceId;
					query.resourceCredentials = {};
					query.query.expectedResultType="COUNT";
				
					//if this is the base resource, we should update the model and everything else
	  				if(resource.additionalPui == undefined) {
	  					this.model.set("query", query);
	  					if(this.dataSelection){
	  						this.dataSelection.updateQuery(query);
	  						this.dataSelection.render();
	  					}
	  		
	  					if(overrides.updateConsentFilters){
	  						overrides.updateConsentFilters(query, settings);
	  					}
	  				} else {
	  					query.query.requiredFields.push(resource.additionalPui);
	  				}
					
	  				// handle 'number of genomic samples'. do not overwrite an existing variant info (likely selected by user)
	  				if(resource.additionalVariantCategory &&  _.isEmpty(query.query.variantInfoFilters[0].categoryVariantInfoFilters)){
	  					query.query.variantInfoFilters[0].categoryVariantInfoFilters = JSON.parse(resource.additionalVariantCategory);
	  				}
	
	  				var dataCallback = function(result, resultId){
	  					//if this is the main resource query, set total patients
	  					if(resource.additionalPui == undefined){
	  						var count = parseInt(result);
	  						this.model.set("totalPatients", count);
	  						this.model.set("queryRan", true);
	  						this.model.set("spinning", false);
	  						
	  						//allow UI overrides the opportunity to customize results (not for sub queries)
	  		                if(overrides.dataCallback ) {
	  		                	overrides.dataCallback(query, resultId, this.model);
	  		                }
	  					}else{
	  						// Otherwise just call the subqueries defined
	  						var count = parseInt(result);
	  						this.model.get("resources")[resource.id].queryRan = true;
	  						this.model.get("resources")[resource.id].patientCount = count;
	  						this.model.get("resources")[resource.id].spinning = false;
	  					}
		                this.render();
		                
		                if(resource.additionalPui == undefined){
			            	//then update the data selection if present (but only do this once)
			    			this.select();
		                }
	  				}.bind(this);

	  				var errorCallback = function(message){
	  					if(resource.additionalPui == undefined){
	  						this.model.set("totalPatients", '-');
	  					}else{
	  						this.model.get("resources")[resource.id].queryRan = true;
	  						this.model.get("resources")[resource.id].patientCount = '-';
	  						this.model.get("resources")[resource.id].spinning = false;
	  					}
	  					
	  					if(_.every(this.model.get('resources'), (resource)=>{return resource.spinning==false})){
							this.model.set("spinning", false);
							this.model.set("queryRan", true);
						}
	  					
	  					this.render();
	  					if(resource.additionalPui == undefined){
	  						$("#patient-count").html(message);
	  					} else {
	  						console.log("error in query");
	  					}
	  				}.bind(this);
	
					$.ajax({
					 	url: window.location.origin + "/picsure/query/sync",
					 	type: 'POST',
					 	headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
					 	contentType: 'application/json',
					 	data: JSON.stringify(query),
	  				 	success: function(response, textStatus, request){
	  				 		dataCallback(response, request.getResponseHeader("resultId"));
	  						}.bind(this),
					 	error: function(response){
							if (!transportErrors.handleAll(response, "Error while processing query")) {
								response.responseText = "<h4>"
									+ overrides.outputErrorMessage ? overrides.outputErrorMessage : "There is something wrong when processing your query, please try it later, if this repeats, please contact admin."
									+ "</h4>";
						 		errorCallback(response.responseText);
							}
						}
					});
				}.bind(this));
			},
			copyToken: function(){
	            var sel = getSelection();
	            var range = document.createRange();
	
	            var element = $(".picsure-result-id")[0]
	            // this if for supporting chrome, since chrome will look for value instead of textContent
	            element.value = element.textContent;
	            range.selectNode(element);
	            sel.removeAllRanges();
	            sel.addRange(range);
	            document.execCommand("copy");
	        },
			render: function(){
				this.$el.html(this.template(this.model.toJSON()));
				if(this.dataSelection){
					this.dataSelection.setElement($("#concept-tree-div",this.$el));
					this.dataSelection.render();
				}
			}
		});
	
	return {
		View : new outputView({
			model: new outputModel()
		})
	}
});
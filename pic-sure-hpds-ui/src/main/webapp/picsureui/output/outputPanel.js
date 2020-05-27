define(["text!../settings/settings.json", "output/dataSelection", "text!output/outputPanel.hbs","picSure/resourceMeta", "picSure/ontology", "backbone", "handlebars", "overrides/outputPanel"],
		function(settings, dataSelection, outputTemplate, resourceMeta, ontology, BB, HBS, overrides){

	HBS.registerHelper("outputPanel_obfuscate", overrides.countDisplayOverride ? overrides.countDisplayOverride : 
		function(count){
			return count;
		});
  
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

	var outputView = overrides.viewOverride ? overrides.viewOverride :	BB.View.extend({
		ontology: ontology,
		initialize: function(){
			this.template = HBS.compile( overrides.outputTemplate ? overrides.outputTemplate : outputTemplate);
			overrides.renderOverride ? this.render = overrides.renderOverride.bind(this) : undefined;
		},
		events:{
			"click #select-btn": "select",
			"click .copy-button": "copyToken"
		},
		select: function(event){
			
			this.model.set('spinning', true);
			var query = JSON.parse(JSON.stringify(this.model.get("query")));
			if(!this.dataSelection){
				this.dataSelection = new dataSelection({query:query});
				$("#concept-tree-div",this.$el).append(this.dataSelection.$el);
			} else {
				this.dataSelection.updateQuery(query);
			}
			
			this.model.set("spinning", false);
			this.dataSelection.render();
		},
//			totalCount: 0,
//			tagName: "div",
		update: function(incomingQuery){
			this.model.set("totalPatients",0);
			//we can't check for 'required fields' here because the subqueries may use that to drive some selection
  			if (incomingQuery.query.requiredFields.length == 0
				&& _.keys(incomingQuery.query.numericFilters).length==0 
				&& _.keys(incomingQuery.query.categoryFilters).length==0
				&& _.keys(incomingQuery.query.variantInfoFilters).length==0
				&& _.keys(incomingQuery.query.categoryFilters).length==0) {
  				// clear the model
  				_.each(this.model.get('resources'), function(picsureInstance){
  					picsureInstance.id.patientCount = 0;
  				}.bind(this));
  				this.render();
  				return;
  			}
			this.model.spinAll();
			this.render();
  
			//run a query for each resource 
			_.each(outputModelDefaults.resources, function(resource){
				// make a safe deep copy of the incoming query so we don't modify it
				var query = JSON.parse(JSON.stringify(incomingQuery));
				query.resourceUUID = JSON.parse(settings).picSureResourceId;
				query.resourceCredentials = {};
				query.query.expectedResultType="COUNT";
				
				//if this is the base resource, we should update the model
  				if(resource.additionalPui == undefined) {
  					this.model.set("query", query);
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
  						// Otherwise just call the subqueries defined
  					}else{
  						var count = parseInt(result);
  						this.model.get("resources")[resource.id].queryRan = true;
  						this.model.get("resources")[resource.id].patientCount = count;
  						this.model.get("resources")[resource.id].spinning = false;
  					}
  					
  					//allow UI overrides the opportunity to customize results
	                if(overrides.dataCallback) {
	                	overrides.dataCallback(query, resultId, this.model);
	                }
	                
	                this.render();
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
						if (response.status === 401) {
							sessionStorage.clear();
							window.location = "/";
						} else {
							response.responseText = "<h4>"
								+ overrides.outputErrorMessage ? overrides.outputErrorMessage : "There is something wrong when processing your query, please try it later, if this repeats, please contact admin."
								+ "</h4>";
					 		errorCallback(response.responseText);
						}
					}
				});
			}.bind(this));
			
			//then update the data selection if present
			this.select();
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

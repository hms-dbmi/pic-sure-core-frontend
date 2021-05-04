define(["jquery", "output/dataSelection", "text!output/outputPanel.hbs", "picSure/ontology", "backbone", "handlebars", "overrides/outputPanel", "common/transportErrors"],
		function($,  dataSelection, outputTemplate, ontology, BB, HBS, overrides, transportErrors){

	var outputModel = overrides.modelOverride ? overrides.modelOverride : BB.Model.extend({
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
				if(this.model.get("query") && !this.dataSelection){
					var query = JSON.parse(JSON.stringify(this.model.get("query")));
					if(!this.dataSelection){
						this.dataSelection = new dataSelection({query:JSON.parse(JSON.stringify(this.model.baseQuery))});
						$("#concept-tree-div",this.$el).append(this.dataSelection.$el);
					} else {
						this.dataSelection.updateQuery(query);
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
				
				$("#patient-count").html(count);  //do we need to render() instead?
                //and update the data selection panel
    			this.select();
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
					overrides.runQuery(this, incomingQuery, this.dataCallback, this.errorCallback);
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
			//update is the old function with many hooks;  use runQuery instead.
			update: function(incomingQuery){
				console.log("OLD UPDATE CALLED");
				this.model.set("totalPatients",0);
				this.model.spinAll();
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
define(["jquery", "filter/searchResult", "handlebars", "text!filter/searchResultTabs.hbs", "text!filter/searchResultSubCategories.hbs", "text!../settings/settings.json"],
		function($, searchResult, HBS, searchResultTabsTemplate, searchSubCatTemplate, settings){
	var searchResults = {
			init : function(data, view, callback){
				this.searchResultTabs = HBS.compile(searchResultTabsTemplate);
				this.searchSubCategories = HBS.compile(searchSubCatTemplate);
				this.addSearchResultRows(data, view, callback, view.model.get("searchTerm"));
			}
	};
	searchResults.addSearchResultRows = function(data, filterView, queryCallback, searchTerm){
		
		//we want case INsensitive comparisons always
		searchTerm = searchTerm.toLowerCase();
		var settingsJson = JSON.parse(settings);
		var getAliasName = function(key){
			if(settingsJson.categoryAliases && settingsJson.categoryAliases[key]){
                return settingsJson.categoryAliases[key];
            } else {
                return key;
            }
		}
		var keys = _.keys(data);
		var aliases = [];
		keys.forEach((key) => {
			var alias = getAliasName(key)
			if(aliases.indexOf(alias) == -1){
				aliases.push(alias);
			}
		});
		
		
		var compiledSubCategoryTemplate = this.searchSubCategories;
		filterView.$el.hide();
 		$('.search-tabs', filterView.$el).append(this.searchResultTabs(
 				{filterId: filterView.model.attributes.filterId,
 				 aliases: aliases}	));
		
		
		keys.forEach((key) => {
			var subCategories = [];
			var categorySearchResultViews = [];
			_.each(data[key], function(value){
				var matchedSelections = [];
				// For categorical or INFO columns, we want to render a search result for each value that matches the search term
				if(value.columnDataType == "INFO"){
					_.each(value.metadata.values, function(categoryValue){
						//use unshift here to make sure exact matches are ranked higher than partial matches
						if(categoryValue.toLowerCase() == searchTerm){
							matchedSelections.unshift(categoryValue);
						} else if (categoryValue.toLowerCase().includes(searchTerm)){
							matchedSelections.push(categoryValue);
						}
					});
				} else if ( value.columnDataType == "CATEGORICAL"	 ) {
					_.each(value.metadata.categoryValues, function(categoryValue){
						if(categoryValue.toLowerCase() == searchTerm){
							matchedSelections.unshift(categoryValue);
						} else if (categoryValue.toLowerCase().includes(searchTerm)){
							matchedSelections.push(categoryValue);
						}
					});
				}
				//now build the objects (View/Model) for the results
				if(matchedSelections.length > 0){
					//generate an individual search result for categorical values matching the search term.
					_.each(matchedSelections, function(categoryValue){
						value.preSelection = categoryValue;
						categorySearchResultViews.push( new searchResult.View({
							queryCallback : queryCallback,
							model : new searchResult.Model(value),
							filterView: filterView,
						}));
					} );
				} else {			
					categorySearchResultViews.push( new searchResult.View({
						queryCallback : queryCallback,
						model : new searchResult.Model(value),
						filterView: filterView,
					}));
				}

				

				// identify any sub categories, and save them.  do not add a sub category for leaf nodes.  
				valuePath = value.data.substr(1, value.data.length-2).split('\\');;
				if(valuePath.length > 2){
					subCategoryName = valuePath[1];
					if(subCategories[subCategoryName] ){
						subCategories[subCategoryName] = subCategories[subCategoryName] + 1;
					} else {
						subCategories[subCategoryName] = 1;
					}
				}
				
			});
			data[key] = undefined;
			
			//check to see if we have any valid results; we may have filtered them all out
			if(categorySearchResultViews.length == 0){
				//remove the 'category pill'
				$('#'+getAliasName(key)+'-pill', filterView.$el).remove();
				aliases = aliases.filter(item => item !== getAliasName(key))
				return true; //then we don't need to worry about doing the subcategory work.
			}

			_.each(categorySearchResultViews, function(newSearchResultRow){
        //something is a little janky here, as we are seeing a funny 'description' string in the value field
				// for gene info columns.  lets fix it.
				if(newSearchResultRow.model.get("columnDataType") == "INFO"){
					newSearchResultRow.model.set("value", newSearchResultRow.model.get("category") );
				}
				newSearchResultRow.render();
			});
			
			//save this tab object so we don't keep looking it up
			var tabPane = $('#'+getAliasName(key)+'.tab-pane', filterView.$el)

			if(_.keys(subCategories).length > 1){
				$(".result-subcategories-div", tabPane).append(compiledSubCategoryTemplate(_.keys(subCategories)));
				//bootstap.js is used for the top-level category pills; here we are keeping a bit of the naming scheme
				// need to roll our own logic so that the 'all results' sub-category tab works as expected
				$(".sub-nav-pills li", tabPane).click(function(event){
					event.preventDefault();
					$(event.target.parentElement).addClass("active")
					$(event.target.parentElement).siblings().removeClass("active");
					
					$('.tab-pane.active').hide();
					if(event.target.text == "All Results"){
						_.each(categorySearchResultViews, function(result){
							result.$el.show();
						});
					} else {
						_.each(categorySearchResultViews, function(result){
							var resultPath = result.model.attributes.data.substr(1, result.model.attributes.data.length-2).split('\\');
							if(resultPath.length > 1 && resultPath[1] == event.target.text){
								result.$el.show();
							} else {
								result.$el.hide();
							}
						});
					}
					$('.tab-pane.active').show();
				});
			}

			$(".search-result-list", tabPane).append(_.pluck(categorySearchResultViews, "$el"));

		});

		$("#"+_.first(aliases)).addClass("active");
		$(".nav-pills li:first-child").addClass("active");
		
		//hide category selection if only a single category.
		if(keys.length > 1) {
			$(".filter-search > .nav-pills").show();
		} else {
			//dont forget to show the cats again if we update!
			$(".filter-search > .nav-pills").hide();
		}
		filterView.$el.show();
	}.bind(searchResults);

	return searchResults;
});

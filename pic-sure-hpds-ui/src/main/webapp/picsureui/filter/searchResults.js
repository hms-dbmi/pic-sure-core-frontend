define(["output/outputPanel","picSure/queryBuilder", "filter/searchResult", "handlebars", "text!filter/searchResultTabs.hbs", "text!filter/searchResultSubCategories.hbs", "text!../settings/settings.json"],
		function(outputPanel, queryBuilder, searchResult, HBS, searchResultTabsTemplate, searchSubCatTemplate, settings){
	var searchResults = {
			init : function(data, view, callback){
				this.searchResultTabs = HBS.compile(searchResultTabsTemplate);
				this.searchSubCategories = HBS.compile(searchSubCatTemplate);
				this.addSearchResultRows(data, view, callback);
			}
	};
	searchResults.addSearchResultRows = function(data, filterView, queryCallback){
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
			aliases.push(getAliasName(key));
		});
		
		var compiledSubCategoryTemplate = this.searchSubCategories;
		$('.search-tabs', filterView.$el).append(this.searchResultTabs(aliases));
		keys.forEach((key) => {
			var subCategories = [];
			var categorySearchResultViews = [];
			_.each(data[key], function(value){
				var newSearchResultRow = new searchResult.View({
					queryCallback : queryCallback,
					model : new searchResult.Model(value),
					filterView: filterView
				});

				//something is a little janks here, as we are seeing a funny 'description' string in the value field
				// for gene info columns.  lets fix it.
				if(newSearchResultRow.model.get("columnDataType") == "INFO"){
					newSearchResultRow.model.set("value", newSearchResultRow.model.get("category") );
				}

				newSearchResultRow.render();
				// identify any sub categories, and save them

				//trim off leading and trailing slashes.  !! Assume all data starts and ends with '\' !!
				valuePath = value.data.substr(1, value.data.length-2).split('\\');;
				// do not add a sub category for leaf nodes.  
				if(valuePath.length > 2){
					//console.log('subcategory : ' + valuePath[1]);
					subCategoryName = valuePath[1];
					if(subCategories[subCategoryName] ){
						subCategories[subCategoryName] = subCategories[subCategoryName] + 1;
					} else {
						subCategories[subCategoryName] = 1;
					}
				}
				
				categorySearchResultViews.push(newSearchResultRow);
			});
			data[key] = undefined;

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
	}.bind(searchResults);

	return searchResults;
});

define(["output/outputPanel","picSure/queryBuilder", "filter/searchResult", "handlebars", "text!filter/searchResultTabs.hbs"],
		function(outputPanel, queryBuilder, searchResult, HBS, searchResultTabsTemplate){
	var searchResults = {
			init : function(data, view, callback){
				this.searchResultTabs = HBS.compile(searchResultTabsTemplate);
				this.addSearchResultRows(data, view, callback);
			}
	};
	searchResults.addSearchResultRows = function(data, filterView, queryCallback){
		var keys = _.keys(data).sort();
		$('.search-tabs', filterView.$el).append(this.searchResultTabs(keys));
		keys.forEach((key) => {
			var categorySearchResultViews = [];
			$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
				if(data[key]){
					_.each(data[key], function(value){
						var newSearchResultRow = new searchResult.View({
							queryCallback : queryCallback,
							model : new searchResult.Model(value),
							filterView: filterView
						});
						newSearchResultRow.render();

						categorySearchResultViews.push(newSearchResultRow);
						data[key] = undefined;
					});
					$('#'+key+'.tab-pane', filterView.$el).append(_.pluck(categorySearchResultViews, "$el"));
				}
			});

		});

		$("#"+_.first(keys)).addClass("active");
		$(".nav-pills li:first-child").addClass("active");
		$('a[data-label="'+_.first(keys)+'"]').trigger('shown.bs.tab')

	}.bind(searchResults);

	return searchResults;
});

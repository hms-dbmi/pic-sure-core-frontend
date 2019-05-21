define(["output/outputPanel","picSure/queryBuilder", "filter/filter"], 
		function(outputPanel, queryBuilder, filter){
	var filterList = {
		init : function(){
			$('#filter-list').html();
			this.filters = [];
			this.addFilter();
		}
	};
	filterList.addFilter = function(){
		$('.filter-boolean-operator').removeClass('hidden');
		var newFilter = new filter.View({
			queryCallback : this.runQuery,
			model : new filter.Model(),
			removeFilter : this.removeFilter,
		});
		newFilter.render();
		this.filters.push(newFilter);
		$('#filter-list').append(newFilter.$el);
/*
		var grouped = _.groupBy($('#filter-list').children(), function(child){
			if($(child).hasClass("variant-info-filter")) return "info";
			if($(child).hasClass("saved")) return "pheno";
			if($(child).hasClass("filter-grouping")) return "filter-grouping";
			return "unsaved";
		});
		$('#filter-list .filter-grouping').remove();
		$('#filter-list').children().detach();
		if(grouped.info && grouped.info.length > 0){
			$('#filter-list').append("<h1 class='filter-grouping'>Variant Info Filters</h1>");
			$('#filter-list').append("<h3 class='filter-grouping'>Patients who do not have at least one variant matching all of these filters will be excluded from results.</h3>");
			$('#filter-list').append(grouped.info);			
		}
		if(grouped.pheno && grouped.pheno.length > 0){
			$('#filter-list').append("<h1 class='filter-grouping'>Phenotype Filters</h1>");
			$('#filter-list').append("<h3 class='filter-grouping'>Patients who do not match all of these filters will be excluded from results.</h3>");
			$('#filter-list').append(grouped.pheno);			
		}
		$('#filter-list').append("<h1 class='filter-grouping'>Add Filter</h1>");
		$('#filter-list').append("<h3 class='filter-grouping'>Use the search box to add new filters.</h3>");
		$('#filter-list').append(grouped.unsaved);*/
	}.bind(filterList);
	filterList.runQuery = function(){
		var query = queryBuilder.createQuery(
				_.pluck(this.filters, "model"));
		outputPanel.View.update(query);
		if(_.countBy(this.filters, function(filter){
			return filter.model.get("searchTerm").trim() === "" ? "empty" : "notEmpty";
		}).empty == undefined) {
            this.addFilter();
        }
	}.bind(filterList);
	filterList.removeFilter = function (cid) {
         var indexToRemove;
        for (var i = 0; i < this.filters.length; i++) {
            if (this.filters[i].cid === cid) {
                indexToRemove = i;
                break;
            }
		}
		// now remove view from list
		if (typeof indexToRemove != 'undefined') {
            this.filters[i].remove();
            this.filters.splice(indexToRemove, 1);
        }
        this.runQuery();
	}.bind(filterList);

	return filterList;
});

define(["jquery","picSure/queryBuilder", "filter/filter", "picSure/ontology", "overrides/filterList",
			"text!filter/searchHelpTooltip.hbs"],
		function($, queryBuilder, filter, ontology, overrides, searchHelpTooltipTemplate){

	var renderHelpCallback = function(filterView) {
        ontology.getInstance().allInfoColumnsLoaded.then(function(){
            $('.show-help-modal').click(function() {
                $('#modal-window').html(HBS.compile(searchHelpTooltipTemplate)(ontology.getInstance().allInfoColumns()));
                $('#modal-window', this.$el).tooltip();
                $(".close").click(function(){
                    $("#search-help-modal").hide();
                });
                $("#search-help-modal").show();
            });
        }.bind(filterView));
    };
	
	var filterList = {
		init : function(resourceUUID, outputPanelView, queryTemplate){
			$('#filter-list').html();
			this.filters = [];
			this.resourceUUID = resourceUUID;
			this.renderHelpCallback = overrides.renderHelpCallback ? overrides.renderHelpCallback : renderHelpCallback;
			this.outputPanelView = outputPanelView;
			this.queryTemplate = queryTemplate;
			this.addFilter();
		}
	};
	filterList.addFilter = function(){
		$('.filter-boolean-operator').removeClass('hidden');
		var newFilter = new filter.View({
			queryCallback : this.runQuery,
			model : new filter.Model(),
			removeFilter : this.removeFilter,
			resourceUUID: this.resourceUUID
		});
		newFilter.render();
		this.filters.push(newFilter);
		$('#filter-list').append(newFilter.$el);

		if (typeof this.renderHelpCallback !== 'undefined') {
			this.renderHelpCallback(this);
		}
	}.bind(filterList);
	filterList.runQuery = function(){
		var query = queryBuilder.generateQuery(
				_.pluck(this.filters, "model"), this.queryTemplate, this.resourceUUID);
		this.outputPanelView.runQuery(query);
		if(_.countBy(this.filters, function(filter){
			return $(".search-box", filter.$el).is(":visible") ? "visible" : "hidden";
		}).visible == undefined) {
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

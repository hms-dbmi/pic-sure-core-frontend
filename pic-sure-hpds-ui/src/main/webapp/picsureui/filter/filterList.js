define(["jquery", "handlebars", "picSure/queryBuilder", "filter/filter", "picSure/ontology", "overrides/filterList", "filter/searchHelpTooltipView", "common/modal",
	"underscore"],
		function($, HBS, queryBuilder, filter, ontology, overrides, helpView, modal, _){

	var defaultRenderHelpCallback = function(filterView) {
        ontology.getInstance().allInfoColumnsLoaded.then(function(){
            $('.show-help-modal').click(function() {
            	HBS.registerHelper('eq', function(arg1, arg2, options) {
            	    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
            	});
				const infoColumns = ontology.getInstance().allInfoColumns();
				modal.displayModal(new helpView({infoColumns: infoColumns}), "Instructions",  ()=>{
					$('.show-help-modal').focus();
				}, {isHandleTabs: true});
            });
        }.bind(filterView));
    };
	
	var filterList = {
			//BDC has two different help callbacks, so we can't use the basic 'overrides' mechanism
		init : function(resourceUUID, outputPanelView, queryTemplate, renderHelpCallbackOverride){
			$('#filter-list').html();
			this.filters = [];
			this.resourceUUID = resourceUUID;
			if(renderHelpCallbackOverride){
				this.renderHelpCallback = renderHelpCallbackOverride
			} else {
				this.renderHelpCallback = overrides.renderHelpCallback ? overrides.renderHelpCallback : defaultRenderHelpCallback;
			}
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

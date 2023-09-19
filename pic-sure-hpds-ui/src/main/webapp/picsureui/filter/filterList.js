define(["jquery", "handlebars", "picSure/queryBuilder", "filter/filter", "picSure/ontology", "overrides/filterList", "filter/searchHelpTooltipView", "common/modal", "underscore", "filter/genomic-filter-view", "filter/selected-genomic-filters",
	"underscore"],
		function($, HBS, queryBuilder, filter, ontology, overrides, helpView, modal, _, genomicFilterView, selectedGenomicFilters){

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
			const dataForSelectedFitlers = {
				title: 'Genomic Filters', 
				editAction: this.editGenomicFilters.bind(this),
				clearButton: true,
				clearAction: () => {
					this.selectedGenomicFilters.clearLists();
					this.runQuery();
				}
			}
			this.selectedGenomicFilters = new selectedGenomicFilters(dataForSelectedFitlers);
			this.selectedGenomicFilters.render();
			Backbone.pubSub.on("update:genomicFilter", this.addGenomicFilter);
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
	filterList.addGenomicFilter = function(newFilter){
		if ($("#selected-genomic-filter").html() == undefined || $("#selected-genomic-filter").html() == "") {
			$("#selected-genomic-filter").html(this.selectedGenomicFilters.$el);
		}
		let filter = {
			Gene_with_variant: newFilter?.categoryVariantInfoFilters?.Gene_with_variant,
			Variant_frequency_as_text: newFilter?.categoryVariantInfoFilters?.Variant_frequency_as_text,
			Variant_consequence_calculated: newFilter?.categoryVariantInfoFilters?.Variant_consequence_calculated
		}
		this.selectedGenomicFilters.updateFilter(filter);
		this.selectedGenomicFilters.render();
		this.runQuery(newFilter);
	}.bind(filterList);
	filterList.runQuery = function(genomicFilter){
		var query = queryBuilder.generateQuery(
				_.pluck(this.filters, "model"), this.queryTemplate, this.resourceUUID);
		if (genomicFilter) {
			const merged = {...query.query.variantInfoFilters, ...genomicFilter};
			query.query.variantInfoFilters = merged;
		}
		this.outputPanelView.runQuery(query);
		if(_.countBy(this.filters, function(filter){
			return $(".search-box", filter.$el).is(":visible") ? "visible" : "hidden";
		}).visible == undefined) {
            this.addFilter();
        }
	}.bind(filterList);
	filterList.editGenomicFilters = function(){
		const filter = this.selectedGenomicFilters.getCurrentFilter();
		let genomicFilter = new genomicFilterView({el: $(".modal-body"), currentFilter: filter});
		genomicFilter.render();
		modal.displayModal(genomicFilter, 'Genomic Filtering', function() {
			$('#filter-list').focus();
		});
	};
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
// Backbone.pubSub.on("update:genomicFilter", );
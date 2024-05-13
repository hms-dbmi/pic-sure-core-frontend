define(["jquery", "handlebars", "underscore", "picSure/queryBuilder", "filter/filter", "picSure/ontology", "overrides/filterList", "filter/searchHelpTooltipView", "common/modal", "underscore", "filter/genomic-filter-view", "filter/selected-genomic-filters",
	"underscore"],
		function($, HBS, _, queryBuilder, filter, ontology, overrides, helpView, modal, _, genomicFilterView, selectedGenomicFilters){

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
	const mergeVariantInfoFilters = (...arrays) => {
		const mergedFilter = {
		categoryVariantInfoFilters: {
			Gene_with_variant: [],
			Variant_frequency_as_text: [],
			Variant_consequence_calculated: [],
			Variant_severity: []
		},
		numericVariantInfoFilters: {},
		};

		arrays.forEach((array) => {
		if (array && array.length > 0) {
			const filter = ensureFilterQuality(array[0]);
			mergedFilter.categoryVariantInfoFilters.Gene_with_variant = mergeTwo(
			mergedFilter.categoryVariantInfoFilters.Gene_with_variant,
			filter.categoryVariantInfoFilters.Gene_with_variant
			);
			mergedFilter.categoryVariantInfoFilters.Variant_frequency_as_text =
			mergeTwo(
				mergedFilter.categoryVariantInfoFilters.Variant_frequency_as_text,
				filter.categoryVariantInfoFilters.Variant_frequency_as_text
			);
			mergedFilter.categoryVariantInfoFilters.Variant_consequence_calculated =
			mergeTwo(
				mergedFilter.categoryVariantInfoFilters
				.Variant_consequence_calculated,
				filter.categoryVariantInfoFilters.Variant_consequence_calculated
			);
			mergedFilter.categoryVariantInfoFilters.Variant_severity =
			mergeTwo(
				mergedFilter.categoryVariantInfoFilters.Variant_severity,
				filter.categoryVariantInfoFilters.Variant_severity
			);
			mergedFilter.numericVariantInfoFilters = mergeNumericFilters(
			mergedFilter.numericVariantInfoFilters,
			filter.numericVariantInfoFilters
			);
		}
		});

		//if any of the merged filters arrays are empty, remove them
		if (mergedFilter.categoryVariantInfoFilters.Gene_with_variant.length === 0) {
			delete mergedFilter.categoryVariantInfoFilters.Gene_with_variant;
		}
		if (mergedFilter.categoryVariantInfoFilters.Variant_frequency_as_text.length === 0) {
			delete mergedFilter.categoryVariantInfoFilters.Variant_frequency_as_text;
		}
		if (mergedFilter.categoryVariantInfoFilters.Variant_consequence_calculated.length === 0) {
			delete mergedFilter.categoryVariantInfoFilters.Variant_consequence_calculated;
		}
		if (mergedFilter.categoryVariantInfoFilters.Variant_severity.length === 0) {
			delete mergedFilter.categoryVariantInfoFilters.Variant_severity;
		}

		return mergedFilter;
	};

  const ensureFilterQuality = (filter = {}) => {
	filter.categoryVariantInfoFilters = filter.categoryVariantInfoFilters || {
	  Gene_with_variant: [],
	  Variant_frequency_as_text: [],
	  Variant_consequence_calculated: [],
	};
  
	filter.numericVariantInfoFilters = filter.numericVariantInfoFilters || {};
  
	return filter;
  };

  const hasGenomicFiltersFromFilterModal = (filter = {}) => {
	return filter?.variantInfoFilters?.[0]?.categoryVariantInfoFilters?.Gene_with_variant?.length > 0 ||
	  filter?.variantInfoFilters?.[0]?.categoryVariantInfoFilters?.Variant_frequency_as_text?.length > 0 ||
	  filter?.variantInfoFilters?.[0]?.categoryVariantInfoFilters?.Variant_consequence_calculated?.length > 0;
  }

  const handleFinalAnd = (filterList = [], filter = {}) => {
	filterList.length > 1 && hasGenomicFiltersFromFilterModal(filter) 
			? $('#phenotypic-filters-container .filter-list-entry:last-of-type .filter-boolean-operator').show() 
			: $('#phenotypic-filters-container .filter-list-entry:last-of-type .filter-boolean-operator').hide();
  };
  

  const mergeTwo = (a = [], b = [], predicate = (a, b) => a === b) => {
	const c = new Set(Array.isArray(a) ? a : []);
	
	if (Array.isArray(b)) {
	  b.forEach((bItem) => c.add(bItem));
	}
  
	return [...c];
  };

  const mergeNumericFilters = (a, b) => {
    return { ...a, ...b }; // Merging numeric filters by object spread, TODO: make better someday if needed
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
			let filterRef = this.addFilter();
			const dataForSelectedFitlers = {
				title: 'Genomic Filters', 
				editAction: this.editGenomicFilters.bind(this),
				clearButton: true,
				clearAction: () => {
					this.selectedGenomicFilters.clearLists();
					this.selectedGenomicFilters.$el.html('');
					handleFinalAnd(this.filters, undefined);
					this.runQuery();
				}
			}
			this.selectedGenomicFilters = new selectedGenomicFilters(dataForSelectedFitlers);
			this.selectedGenomicFilters.render();
			Backbone.pubSub.on("update:genomicFilter", this.addGenomicFilter);
			return filterRef;
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
		$('#filter-list').prepend(newFilter.$el);
		handleFinalAnd(this.filters, this.selectedGenomicFilters?.getCurrentFilter());
		if (typeof this.renderHelpCallback !== 'undefined') {
			this.renderHelpCallback(this);
		}
		return newFilter;
	}.bind(filterList);
	filterList.addGenomicFilter = function(newFilter){
		if ($("#selected-genomic-filter").html() == undefined || $("#selected-genomic-filter").html() == "") {
			$("#selected-genomic-filter").html(this.selectedGenomicFilters.$el);
		}
		let filter = {};
		if (newFilter?.categoryVariantInfoFilters?.Gene_with_variant) {
			filter.Gene_with_variant = newFilter?.categoryVariantInfoFilters?.Gene_with_variant;
		}
		if (newFilter?.categoryVariantInfoFilters?.Variant_frequency_as_text) {
			filter.Variant_frequency_as_text = newFilter?.categoryVariantInfoFilters?.Variant_frequency_as_text;
		}
		if (newFilter?.categoryVariantInfoFilters?.Variant_consequence_calculated) {
			filter.Variant_consequence_calculated = newFilter?.categoryVariantInfoFilters?.Variant_consequence_calculated;
		}
		this.selectedGenomicFilters.updateFilter(filter);
		this.selectedGenomicFilters.render();
		handleFinalAnd(this.filters, this.selectedGenomicFilters?.getCurrentFilter());
		this.runQuery();
	}.bind(filterList);
	filterList.runQuery = function(){
	    var duplicatePaths = this.filters
	        .filter(f => f.model.attributes.concept && f.model.attributes.concept.data)
	        .map(f => f.model.attributes.concept.data)
	        // group by count(*)
	        .reduce((acc, cur) => { acc.set(cur, (acc.get(cur) || 0) + 1); return acc;}, new Map())
	        .entries() // key = 0, count = 1
	        .filter(e => e[1] > 1)
	        .map(e => e[0]);
	    duplicatePaths = Array.from(duplicatePaths);
	    $("#duplicate-query-warning").attr("hidden", duplicatePaths.length === 0);
		var query = queryBuilder.generateQuery(
				_.pluck(this.filters, "model"), this.queryTemplate, this.resourceUUID);
		let filterFromSelectedGenomicFilters = this.selectedGenomicFilters?.getCurrentFilter()?.variantInfoFilters;
		query.query.variantInfoFilters = [
			mergeVariantInfoFilters(query.query.variantInfoFilters, filterFromSelectedGenomicFilters)
		];
		this.outputPanelView.runQuery(query);
		if(_.countBy(this.filters, function(filter){
			return $(".search-box", filter.$el).is(":visible") ? "visible" : "hidden";
		}).visible == undefined) {
            this.addFilter();
        }
	}.bind(filterList);
	filterList.editGenomicFilters = function(){
		let filter = this.selectedGenomicFilters?.getCurrentFilter();
		let filterToEdit = undefined;
		if (filter?.variantInfoFilters[0]) {
			filterToEdit = {
				variantInfoFilters: filter.variantInfoFilters[0]
			}
		}
		let genomicFilter = new genomicFilterView({el: $(".modal-body"), currentFilter: filterToEdit});
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
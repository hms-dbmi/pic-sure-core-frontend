define(['jquery', 'backbone','handlebars', "underscore",
'overrides/genomic-filter-view',
'text!filter/genomic-filter-view.hbs', 
'common/selection-search-panel-view', 
'text!common/selection-panel.hbs',
'text!filter/genomic-filter-partial.hbs',
'picSure/ontology', "common/spinner",
'common/keyboard-nav', 'common/tree-select',
'filter/selected-genomic-filters',
'text!filter/variant-data.json',
'picSure/settings', 'common/transportErrors'],
    function($, BB, HBS, _, overrides, genomicView, searchPanel, selectionPanel, filterContainer, ontology, spinner, keyboardNav, treeSelect, selectedGenomicFilters, variantDataJson, settings, transportErrorHandlers) {
        const geneKey = 'Gene_with_variant';
        const consequenceKey = 'Variant_consequence_calculated';
        const severityKey = 'Variant_severity';
        const classDescription = 'A standardized term from the Sequence Ontology (http://www.sequenceontology.org) to describe the type of a variant. Possible values: deletion, insertion.';
        const frequencyDescription = 'The variant allele frequency in gnomAD exomes of combined population as discrete text categories. Possible values: Rare (variant frequency less than 1%), Common (variant frequency greater than or equal to 1%).';
        const TABABLE_CLASS = '.tabable';
        const SELECTED = 'selected';
        const LIST_ITEM = 'list-item';
        let genomicFilterView = BB.View.extend({
            initialize: function(opts){
                this.previousUniqueId = 0;
                if (!opts.genomicConceptPath) {
                    opts.genomicConceptPath = 'Gene_with_variant';
                }
                $("body").tooltip({ selector: '[data-toggle=tooltip]' });
                this.data = opts;
                this.infoColumns = [];
                this.loadingGenes = this.getNextGenes(1).then((data)=>{
                    this.initGenes = data.results;
                }, (error)=>{console.error(error)});
                this.loadingInfoColumns = ontology.getInstance().allInfoColumnsLoaded.then(function(){
                    this.infoColumns = ontology.getInstance().allInfoColumns();
                    this.data.geneDesc = this.infoColumns.find(col => col.key === geneKey).description.split('"')[1] || 'Error loading description';
                    this.data.consequenceDesc = this.infoColumns.find(col => col.key === consequenceKey).description.split('"')[1] || 'Error loading description';
                    this.data.severityDescription = this.infoColumns.find(col => col.key === severityKey).description.split('"')[1] || 'Error loading description';
                    this.data.classDescription = classDescription;
                    this.data.frequencyDescription = frequencyDescription;
                    this.data.severityDescription = this.data.severityDescription.substring(0, this.data.severityDescription.lastIndexOf(','))+'.';
                    this.render();
                }.bind(this)).catch((error)=>{
                    console.error(error);
                    isLoading = false;
                    this.render();
                });
                this.loadingData = Promise.all([this.loadingGenes, this.loadingInfoColumns]);
                this.template = HBS.compile(genomicView);
                this.filterPartialTemplate = HBS.compile(filterContainer);
                const selectionPanelTemplate = HBS.compile(selectionPanel);
                keyboardNav.addNavigableView('genomic-filter-view', this);
                HBS.registerPartial('selection-panel', selectionPanelTemplate);
                this.on({
                    'keynav-arrowup document': this.navigateUp.bind(this),
                    'keynav-arrowdown document': this.navigateDown.bind(this),
                    'keynav-arrowright document': this.navigateDown.bind(this),
                    'keynav-arrowleft document': this.navigateUp.bind(this),
                    'keynav-enter': this.clickItem.bind(this),
                    'keynav-space': this.clickItem.bind(this)
                });
            },
            events: {
              'click #cancel-genomic-filters' : 'cancelGenomicFilters',
              'click #apply-genomic-filters' : 'applyGenomicFilters',
              'click #clear-genomic-filters' : 'clearGenomicFilters',
              'change input[type="checkbox"]' : 'updateGenomicFilter',
              'updatedLists' : 'updateGenomicFilter',
              'focus #severity .selection-box' : 'onFocusSelection',
              'blur #severity .selection-box' : 'onBlurSelection',
              'focus #variant-class .selection-box' : 'onFocusSelection',
              'blur #variant-class .selection-box' : 'onBlurSelection',
              'focus #frequency-text .selection-box' : 'onFocusSelection',
              'blur #frequency-text .selection-box' : 'onBlurSelection',
            },
            setUpViews: function() {
                const parsedVariantData = JSON.parse(variantDataJson);
                const consequencesList = parsedVariantData.consequences;
                this.data.frequencyOptions = ['Rare', 'Common'];
                const dataForGeneSearch = {
                    heading: 'Gene with Variant',
                    searchContext: 'Select genes of interest',
                    searchResultOptions: this.initGenes,
                    resultContext: 'Selected genes',
                    placeholderText: 'The list of genes below is a sub-set, try typing other gene names (Ex. CHD8)',
                    description: this.data.geneDesc,
                    getNextOptions: this.getNextGenes.bind(this),
                    isRequired: true,
                }
                const dataForConsequenceSearch = {
                    title: 'Variant consequence calculated',
                    tree: consequencesList,
                    ignoreParent: true, 
                    description: this.data.consequenceDesc,
                };
                const dataForSelectedFitlers = {
                    title: 'Selected Genomic Filters', 
                    clearButton: true, 
                    clearAction: this.clearGenomicFilters.bind(this),
                }
                // If editing a previous filter, then repopulate the form.
                if (this.data.currentFilter) {
                    if (this.data.currentFilter.variantInfoFilters.categoryVariantInfoFilters.Gene_with_variant) {
                        dataForGeneSearch.searchResults = [...this.data.currentFilter.variantInfoFilters.categoryVariantInfoFilters.Gene_with_variant];
                    }
                    if (this.data.currentFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_consequence_calculated) {
                        dataForConsequenceSearch.searchResults = [...this.data.currentFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_consequence_calculated];
                    }
                    this.previousFilter = this.data.currentFilter;
                }
                this.geneSearchPanel = new searchPanel(dataForGeneSearch);
                this.consequenceSearchPanel = new treeSelect(dataForConsequenceSearch);
                this.selectedFiltersPanel = new selectedGenomicFilters(dataForSelectedFitlers);
            },
            applyGenomicFilters: function(){
                let filtersForQuery = {
                    categoryVariantInfoFilters: this.data.categoryVariantInfoFilters,
                    numericVariantInfoFilters: {}
                };
                if (overrides && overrides.applyGenomicFilters) {
                    overrides.applyGenomicFilters(this, filtersForQuery);
                    return;
                }
                //this.createUniqueId(filtersForQuery); uncomment to support multiple filters
                //filterModel.addGenomicFilter(filtersForQuery, this.previousUniqueId); //TODO fix for baseline
                this.cancelGenomicFilters();
            },
            clearGenomicFilters: function(){
                this.geneSearchPanel.reset();
                this.consequenceSearchPanel.reset();
                this.selectedFiltersPanel.clearLists();
                this.$el.find('input[type="checkbox"]').prop('checked', false);
                this.data.filters = {};
                this.$el.find('#apply-genomic-filters').prop('disabled', true);
            },
            cancelGenomicFilters: function(){
                this.undelegateEvents();
                $('.close').click();
            },
            createTabIndex: function() {
                let genomicTabIndex = 1000000;
                $('#gene-search-container').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('#frequency-text').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('#consequence-search-container').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('#selected-filters').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('.push-left-and-down').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
            }, 
            reapplyGenomicFilters: function(){
                if (this.previousFilter) {
                    this.previousUniqueId = this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.__uniqueid;
                    if (this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_frequency_as_text) {
                        $('#frequency-text input[type="checkbox"]').each((i, checkbox)  => {
                            let value = checkbox.value.substr(0,1).toUpperCase() + checkbox.value.substr(1).toLowerCase();
                            if (this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_frequency_as_text.includes(value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (!(_.isEmpty(this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Gene_with_variant)) && this.geneSearchPanel.$el.length > 0) {
                        this.geneSearchPanel.$el.find('.selections input[type="checkbox"]').each((i, checkbox)  => {
                            checkbox.checked = true;
                        });
                    }
                    if (!(_.isEmpty(this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_consequence_calculated)) && this.consequenceSearchPanel.$el.length > 0) {
                        this.consequenceSearchPanel.reapply(this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_consequence_calculated);
                    }
                    this.updateGenomicFilter();
                }
            },
            updateDisabledButton: function(){
                if (this.data.categoryVariantInfoFilters && (this.data.categoryVariantInfoFilters.Gene_with_variant && this.data.categoryVariantInfoFilters.Gene_with_variant.length)) {
                    this.$el.find('#apply-genomic-filters').prop('disabled', false);
                    this.$el.find('#apply-genomic-filters-tooltip').tooltip('disable');
                } else {
                    this.$el.find('#apply-genomic-filters').prop('disabled', true);
                    this.$el.find('#apply-genomic-filters-tooltip').tooltip('enable');
                }
            },
            updateGenomicFilter: function(){
                const geneData = this.geneSearchPanel.data.selectedResults;
                const conData = this.consequenceSearchPanel.data.selectedResults;
                const variantFrequencyText = this.$el.find('#frequency-text input[type="checkbox"]:checked');
                let variantFrequencyData = [];
                if (variantFrequencyText.length > 0) {
                    variantFrequencyText.each(function(i, el){
                        $(el).val() && variantFrequencyData.push($(el).val().substr(0,1).toUpperCase() + $(el).val().substr(1).toLowerCase());
                    });
                }

                this.data.categoryVariantInfoFilters = {
                    Gene_with_variant: _.isEmpty(geneData) ? undefined : geneData,
                    Variant_consequence_calculated: _.isEmpty(conData) ? undefined : conData,
                    Variant_frequency_as_text: _.isEmpty(variantFrequencyData) ? undefined : variantFrequencyData,
                };
                this.selectedFiltersPanel.updateFilter(this.data.categoryVariantInfoFilters);
                this.updateDisabledButton();
            },
            createUniqueId: function(obj){
                let uniqueId = '';
                if (obj && Object.keys(obj).length > 0 && Object.values(obj).length > 0) {
                        _.each(obj, (value) => {
                            if (value && typeof value === 'object' && !Array.isArray(value)) {
                                uniqueId += this.createUniqueId(value);
                            } else if (value && Array.isArray(value)) {
                                _.each(value, (entry) => {
                                    uniqueId += entry;
                                });
                            } else if (value) {
                                uniqueId += value
                            }
                        });
                } else {
                    return;
                }
                let hash = 0;
                if (uniqueId.length > 0) {
                    for (let i=0; i<uniqueId.length; i++) {
                        hash = ((hash << 5) - hash) + uniqueId.charCodeAt(i);
                        hash |= 0;
                    }
                }
                Object.defineProperty(obj, "__uniqueid", {value: parseInt(hash), configurable: true, enumerable: false, writable: true});
            },
            onFocusSelection: function(e){
                keyboardNav.setCurrentView('genomic-filter-view');
            },
            onBlurSelection: function(e){
                console.debug("Blur selection", e.target);
                keyboardNav.setCurrentView(undefined);
                $(e.target).find('.' + SELECTED).removeClass(SELECTED);
            },
            navigateUp: function(e) {
                let selectionItems = e.target.querySelectorAll('.' + LIST_ITEM);
                let selectedItem = $(selectionItems).filter('.' + SELECTED);
                if ($(selectedItem).length <= 0) {
                    $(selectionItems).eq(0).addClass(SELECTED);
                    return;
                }
                let index = $(selectionItems).index(selectedItem);
                let nextItem = $(selectionItems).eq(index - 1);
                if (nextItem.length > 0) {
                    selectedItem.removeClass(SELECTED);
                    selectedItem.attr('aria-selected', false);
                    nextItem.attr('aria-selected', true);
                    nextItem.attr('aria-live', "polite");
                    $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
                }
            },
            navigateDown: function(e) {
                let selectionItems = e.target.querySelectorAll('.' + LIST_ITEM);
                let selectedItem = $(selectionItems).filter('.' + SELECTED);
                if ($(selectedItem).length <= 0) {
                    $(selectionItems).eq(0).addClass(SELECTED);
                    return;
                }
                let index = $(selectionItems).index(selectedItem);
                nextItem = (index === selectionItems.length - 1) ? $(selectionItems).eq(0) : $(selectionItems).eq(index + 1);
                if (nextItem.length > 0) {
                    selectedItem.removeClass(SELECTED);
                    selectedItem.attr('aria-selected', false);
                    nextItem.addClass(SELECTED);
                    nextItem.attr('aria-selected', true);
                    nextItem.attr('aria-live', "polite");
                    $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
                }
            },
            clickItem: function(e) {
                let selectedItem = e.target.querySelector('.' + SELECTED);
                selectedItem && selectedItem.click();
            },
            getNextGenes: function(page, searchTerm="a") {
                const url =
                  window.location.origin + "/picsure/search/" + settings.picSureResourceId +
                  "/values/?genomicConceptPath=" + this.data.genomicConceptPath +
                  "&query=" + encodeURIComponent(searchTerm) +
                  "&page=" + page + "&size=20";
                return fetch(encodeURI(url), {
                    method: 'GET',
                    headers: {'Authorization': 'Bearer ' + JSON.parse(sessionStorage.getItem('session')).token, 'content-type': 'application/json'},
                }).then(response => response.json()).then(data => {
                    return data;
                }).catch(error => {
                    console.error(error);
                    transportErrorHandlers.handleAll(error);
                    return [];
                });
            },
            render: function(){
                this.$el.html('<div id="genomic-spinner"></div>');
                spinner.medium(this.loadingData, '#genomic-spinner', ''); 
                this.loadingData.then(function() {
                    this.setUpViews();
                    this.$el.html(this.template(this.data));
                    this.geneSearchPanel.$el = $('#gene-search-container');
                    this.consequenceSearchPanel.$el = $('#consequence-search-container');
                    this.selectedFiltersPanel.$el = $('#selected-filters');
                    this.geneSearchPanel.render();
                    this.consequenceSearchPanel.render();
                    this.previousFilter && this.reapplyGenomicFilters();
                    this.updateDisabledButton();
                    this.createTabIndex();
                }.bind(this));
            }
        });
        return genomicFilterView;
});
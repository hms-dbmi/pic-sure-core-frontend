define(['jquery',
        'backbone',
        'handlebars',
        'underscore',
        'text!common/selection-search-panel.hbs', 
        'common/keyboard-nav',
        'common/spinner'
    ],
    function($, 
             BB, 
             HBS, 
             _, 
             searchPanelTemplate,
             keyboardNav,
             spinner
    ) {
        const LIST_ITEM = 'list-item';
        const SELECTED = 'selected';
        let selectionSearchView = BB.View.extend({
            initialize: function(opts){
                if (opts && opts.heading) {
                    this.data = opts;
                    this.previousSearch = undefined;
                    this.data.searchId = opts.heading.toLowerCase().replace(/\s/g, '-');
                    this.data.searchResultOptionsText = opts.placeholderText || 'Search ' + opts.heading;
                    this.resetSearchResults();
                    this.data.cachedResults = this.data.searchResultOptions;
                    this.data.selectedResults = opts.searchResults || [];
                }
                this.template = HBS.compile(searchPanelTemplate);
                keyboardNav.addNavigableView("selection-search-results", this);
                keyboardNav.addNavigableView("selections",this);
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
                'click #selection-clear-button' : 'clearSelection',
            },
            addEvents: function() {
                $('.value-container.selection-search-results input').on('change', this.selectItem.bind(this));
                $('.value-container.selection-search-results').on('scroll', _.throttle(this.handleScroll.bind(this), 500, {leading: true}));
                $('.value-container.selections input').on('change', this.unselectItem.bind(this));
                $('#'+this.data.searchId+'-selection-clear-button').on('click', this.clearSelection.bind(this));
                $('#'+this.data.searchId+'-selection-select-all').on('click', this.selectAll.bind(this));
                $('.value-container').on('focus', this.focusItem.bind(this));
                $('.value-container').on('blur', this.blurItem.bind(this));
            },
            search: function(e) {
                if (e.target.value.length > 1) {
                    if (typeof this.data.getNextOptions !== typeof(Function)) {
                        this.data.searchResultOptions = this.data.results.filter((result) => {
                            return result.toLowerCase().includes(e.target.value.toLowerCase());
                        });
                        this.renderLists();
                    } else {
                        if (!this.previousSearch || this.previousSearch !== e.target.value) {
                            this.data.page = 1;
                            this.completedResults = false;
                        }
                        this.previousSearch = e.target.value;
                        this.data.getNextOptions(this.data.page, e.target.value).then((data)=>{
                            if (data.results) {
                                this.data.searchResultOptions = data.results; //todo search loading handling
                                this.renderLists();
                            }
                        }, (error)=>{console.error(error)});
                    }
                }else if (e.target.value.length === 0) {
                    typeof this.data.getNextOptions === typeof(Function) ? this.resetSearchResults(this.data.cachedResults) : this.resetSearchResults();
                    this.renderLists();
                }
            },
            clickItem: function(e) {
                let selectedItem = e.target.querySelector('.' + SELECTED);
                selectedItem && selectedItem.click();
            },
            selectItem: function(e) {
                const index = this.data.searchResultOptions.indexOf(e.target.value);
                this.moveItem(this.data.searchResultOptions, this.data.selectedResults, index);
            },
            unselectItem: function(e) {
                const index = this.data.selectedResults.indexOf(e.target.value);
                const searchIndex = this.data.searchResultOptions.indexOf(e.target.value)
                if (searchIndex > -1 && index > -1) {
                    this.data.searchResultOptions.splice(searchIndex, 1);
                }
                this.moveItem(this.data.selectedResults, this.data.searchResultOptions, index);
            },
            moveItem: function(from, to, index) {
                if (index > -1) {
                    let item = from.splice(index, 1)[0];
                    to.unshift(item);
                    this.renderLists();
                }
            },
            clearSelection: function() {
                this.$el.find('#'+this.data.searchId).val('');
                this.data.selectedResults.reverse().forEach((item) => {
                    this.data.searchResultOptions.indexOf(item) === -1 && this.data.searchResultOptions.unshift(item);
                });
                this.data.selectedResults = [];
                this.renderLists();
            },
            selectAll: function() {
                let unselectedItems = $('.selection-search-results input:not(:checked)').map(function(){
                    return $(this).val();
                  }).get();
                this.data.selectedResults = this.data.selectedResults.concat(unselectedItems);
                this.data.searchResultOptions = [];
                this.renderLists();
            },
            focusItem: function(e) {
                console.debug('focusItem', e.target);
                keyboardNav.setCurrentView(e.target.classList[1]);
            },
            blurItem: function(e) {
                console.debug('blurItem', e.target);
                keyboardNav.setCurrentView(undefined);
                $(e.target).find('.'+SELECTED).removeClass(SELECTED);
            },
            resetSearchResults: function(cached) {
                this.data.page = 1;
                this.previousSearch = undefined;
                this.completedResults = false;
                if (cached) {
                    this.data.searchResultOptions = cached
                } else {
                    if (typeof this.data.getNextOptions === typeof(Function)) {
                        this.data.getNextOptions(this.data.page).then((res) => {
                            this.data.searchResultOptions = res.results;
                        });
                    } else {
                        this.data.searchResultOptions = _.sortBy(this.data.results);
                        this.completedResults = true;
                    }
                }      
            },
            navigateUp: function(e) {
                console.debug('navigateUp', e);
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
                    selectedItem.attr('role', 'option');
                    selectedItem.attr('aria-selected', false);
                    nextItem.addClass(SELECTED);
                    nextItem.attr('aria-selected', true);
                    nextItem.attr('aria-live', "polite");
                    $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
                }
            },
            navigateDown: function(e) {
                console.debug('navigateDown', e);
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
                    selectedItem.attr('role', 'option');
                    selectedItem.attr('aria-selected', false);
                    nextItem.addClass(SELECTED);
                    nextItem.attr('aria-selected', true);
                    nextItem.attr('aria-live', "polite");
                    $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
                }
            },
            handleScroll: function(e) {
                if (!this.completedResults) {
                    const container = $(e.target);
                    const scrollTop = container.scrollTop();
                    const containerHeight = container.height();
                    const contentHeight = container[0].scrollHeight;
                    const scrollThreshold = 5;
                    if (contentHeight - (scrollTop + containerHeight) <= scrollThreshold) {
                        this.data.page++;
                        let searchTerm = $('#gene-with-variant').val();
                        if (!searchTerm) { // .val() could return empty string
                            searchTerm = undefined;
                        }
                            let disableListsAndLoad = $.Deferred();
                            $('.value-container input').prop('disabled', true);
                            spinner.small(disableListsAndLoad, "#list-spinner", "");
                            let nextOptionsLoading = this.data.getNextOptions(this.data.page, searchTerm).then((response) => {
                                if (Array.isArray(response.results) && response.results.length === 0 && this.data.page !== 1) {
                                    this.completedResults = true;
                                }
                                this.data.searchResultOptions = this.data.searchResultOptions.concat(response.results);
                                disableListsAndLoad.resolve();
                                this.renderLists();
                            });
                            $.when(disableListsAndLoad, nextOptionsLoading).then(() => {
                                $('.value-container input').prop('disabled', false);
                            });
                    }
                }
            },
            reset() {
                typeof this.data.getNextOptions === typeof(Function) ? this.data.searchResultOptions.concat(this.data.cachedResults) : this.data.searchResultOptions = this.data.results;
                this.data.page = 1;
                this.previousSearch = undefined;
                this.completedResults = false;
                this.clearSelection();
            },
            renderLists: function() {
                const newHTMLList  = this.data.searchResultOptions?.map((item) => {
                    return this.data.selectedResults.indexOf(item) > -1 ? 
                    `<input id="${item}" class="categorical-filter-input selectable list-item" role="option" type="checkbox" value="${item}" checked disabled/>${item}<br/>` : 
                    `<input id="${item}" class="categorical-filter-input selectable list-item" role="option" type="checkbox" value="${item}" />${item}<br/>`;
                }, this);
                newHTMLList.push('<div id="list-spinner"></div>');
                const newHTMLRSelectionList  = this.data.selectedResults?.map((item) => {
                    return `<input id="${item}" class="categorical-filter-input selectable list-item" type="checkbox" value="${item}" checked/>${item}<br/>`;
                });      
                this.$el.find('.selections').html(newHTMLRSelectionList).fadeIn('fast');
                const search = this.$el.find('#'+this.data.searchId)[0] ? this.$el.find('#'+this.data.searchId)[0].value : '';
                if (this.data.searchResultOptions.length <= 0 && search) {
                    this.$el.find('.value-container.selection-search-results').html('<span>No results found</span>');
                } else if (this.data.searchResultOptions.length <= 0 && !search && this.data.results.length > this.data.selectedResults.length) {
                    this.$el.find('.value-container.selection-search-results').html('<span style="color: #AAA">Try searching for more</span>');
                } else {
                    this.$el.find('.selection-search-results').html(newHTMLList).fadeIn('fast');
                }
                this.addEvents();
                this.$el.trigger('updatedLists');
            },
            render: function(){
                this.$el.html(this.template(this.data));
                this.data.description ? this.$el.find('.search-heading').addClass('panel-extra-large') : this.$el.find('.search-heading').removeClass('panel-extra-large');
                const searchInput = this.$el.find('#'+this.data.searchId);
                searchInput && $(searchInput).on('input', this.search.bind(this));
                this.addEvents();
                this.renderLists();
            }
        });
        return selectionSearchView;
    });

define([
    'backbone',
    'handlebars',
    'text!filter/selected-genomic-filters.hbs',
], function(BB, HBS, template){
    let selectedGenomicFilters = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(template);
            this.title = opts.title;
            this.description = opts.description;
            this.clearButton = opts.clearButton;
            this.clearAction = opts.clearAction || this.clearLists;
            this.editAction = opts.editAction || this.editLists;
            this.editAction != undefined ? this.editButton = true : this.editButton = false;
        },
        events : {
            'click #selected-genomic-clear-btn' : 'clear',
            'click #selected-genomic-edit-btn' : 'edit'
        },
        clear: function(){
            this.clearAction();
        },
        clearLists: function(){
            this.selectedVariants = [];
            this.selectedFrequencies = [];
            this.selectedConsequences = [];
            this.render();
        },
        edit: function() {
            this.editAction();
        },
        getCurrentFilter: function(){
            return {variantInfoFilters: {categoryVariantInfoFilters: 
                    {
                        Gene_with_variant: this.selectedVariants,
                        Variant_frequency_as_text: this.selectedFrequencies,
                        Variant_consequence_calculated: this.selectedConsequences
                    }
                }};
        },
        updateFilter: function(filter){
            this.selectedVariants = filter?.Gene_with_variant;
            this.selectedFrequencies = filter?.Variant_frequency_as_text;
            this.selectedConsequences = filter?.Variant_consequence_calculated;
            this.render();
        },
        render: function(){
            this.$el.html(this.template(this));
            this.delegateEvents();
        }
    });
    return selectedGenomicFilters;
});
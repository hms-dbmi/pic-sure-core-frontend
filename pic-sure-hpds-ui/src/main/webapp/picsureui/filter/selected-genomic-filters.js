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
            this.clearButton = true;
            this.clearAction = opts.clearAction || this.clearLists;
        },
        events : {
            'click #selected-genomic-clear-btn' : 'clear',
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
        addVariant: function(variant){
            this.selectedVariants.push(variant);
            this.render();
        },
        addFrequency: function(frequency){
            this.selectedFrequencies.push(frequency);
            this.render();
        },
        addConsequence: function(consequence){
            this.selectedConsequences.push(consequence);
            this.render();
        },
        updateFilter: function(filter){
            this.selectedVariants = filter.Gene_with_variant;
            this.selectedFrequencies = filter.Variant_frequency_as_text;
            this.selectedConsequences = filter.Variant_consequence_calculated;
            this.render();
        },
        render: function(){
            this.$el.html(this.template(this));
            this.delegateEvents();
        }
    });
    return selectedGenomicFilters;
});
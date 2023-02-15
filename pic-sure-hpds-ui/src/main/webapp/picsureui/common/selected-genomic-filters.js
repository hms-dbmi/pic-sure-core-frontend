define([
    'backbone',
    'handlebars',
    'text!common/selected-genomic-filters.hbs',
], function(BB, HBS, template){
    let selectedGenomicFilters = BB.View.extend({
        initialize: function(opts){
            this.searchContext = opts.searchContext;
            this.selectedVariants = this.formatData(opts.selectedVariants);
            this.selectedFrequency = this.formatData(opts.selectedFrequency);
            this.selectedConsequence = this.formatData(opts.selectedConsequence);
            this.template = HBS.compile(template);
            this.clearButton = opts.clearButton;
            this.clearAction = opts.clearAction;
        },
        events : {
            'click #clear-btn' : 'clear'
        },
        clear: function(){
            this.clearAction();
        },
        formatData: function(data){
            let elementList = [];
            data.forEach((listItem, index, data) => {
                let element = document.createElement("div");
                element.innerText = listItem
                elementList.push(element);
                if (!Object.is(data.length - 1, index)){
                    let or = document.createElement("span");
                    or.innerText = ' OR ';
                    or.classList.add('or');
                    elementList.push(or);
                }
            });
            return elementList;
        },
        render: function(){
            this.$el.html(this.template(this));
            this.selectedVariants.length > 0 && this.selectedVariants.forEach((element) => this.$el.find('#selectedVariant').append(element));
            this.selectedFrequency.length > 0 && this.selectedFrequency.forEach((element) => this.$el.find('#selectedFrequency').append(element));
            this.selectedConsequence.length > 0 && this.selectedConsequence.forEach((element) => this.$el.find('#selectedConsequence').append(element));
        }
    });
    return selectedGenomicFilters;
});
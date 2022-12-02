define([
    'backbone',
    'handlebars',
    'text!filter/searchHelpTooltip.hbs'
], function(BB, HBS, helpTemplate) {
    let helpView = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(helpTemplate);
        },
        events: {},
        render: function(){
            this.$el.html(this.template());
        }
    });
    return helpView;
});

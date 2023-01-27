define([
    'backbone',
    'handlebars',
    'text!common/tree-select.hbs',
], function(BB, HBS, template) {
    var TreeSelect = BB.View.extend({
        initialize: function(opts){
            this.tree = opts.tree;
            this.title = opts.title;
            this.description = opts.description;
            this.helpCallback = opts.helpCallback;
            this.template = HBS.compile(template);
        },
        render: function(){
            this.$el.html(this.template(this));
            this.$el.find('#tree').jstree({'core' : {'data': this.tree, 'themes': {'icons': false}}, 'plugins' : ['checkbox']});
        }
    });
    return TreeSelect;
});
define([
    'backbone',
    'handlebars',
    'text!common/tree-select.hbs',
    'common/keyboard-nav',
], function(BB, HBS, template, keyboardNav) {
    const SELECTED = 'selected';
    const TreeSelect = BB.View.extend({
        initialize: function(opts){
            this.data = {};
            this.tree = opts.tree;
            this.title = opts.title;
            this.ignoreParent = opts.ignoreParent;
            this.description = opts.description;
            this.helpCallback = opts.helpCallback;
            this.template = HBS.compile(template);
            this.data.selectedResults = [];
            this.data.severityResults = [];
            keyboardNav.addNavigableView("tree-container", this);
            this.on({
                'keynav-arrowup document': this.navigateUp.bind(this),
                'keynav-arrowdown document': this.navigateDown.bind(this),
                'keynav-arrowright document': this.navigateDown.bind(this),
                'keynav-arrowleft document': this.navigateUp.bind(this),
                'keynav-enter': this.clickItem.bind(this),
                'keynav-space': this.clickItem.bind(this),
            });
        },
        reset: function(){
            this.$el.find('#tree').jstree(true).uncheck_all();
            this.data.selectedResults = [];
            this.$el.trigger('updatedLists');
        },
        reapply: function(prevSelectedResults){
            const tree = this.$el.find('#tree').jstree(true);
            this.$el.find('#tree').on('ready.jstree', () => {
                //There doesn't seem like there is a good way to get all nodes fort this context.
                //We have to check all nodes, get all selected, and then uncheck them.
                tree.check_all();
                const allNodes = tree.get_checked(true);
                tree.uncheck_all();
                prevSelectedResults.forEach((selected) => {
                    let node = null;
                    allNodes.forEach( (nodeData) => {
                        if (nodeData.text === selected) {
                            node = nodeData;
                            return false; // break the loop
                        }
                    });
                    node && tree.check_node(node);
                });
            });
        },
        onFocus: function(e){
            keyboardNav.setCurrentView(e.target.classList[0]);
        },
        onBlur: function(e) {
            keyboardNav.setCurrentView(undefined);
            $(e.target).find('.'+SELECTED).removeClass(SELECTED);
        },
        clickItem: function(e) {
            let selectedItem = e.target.querySelector('.' + SELECTED);
            selectedItem && selectedItem.click();
            $(e.target).focus();
        },
        navigateUp: function(e){
            let selectionItems = e.target.querySelectorAll('.jstree-checkbox');
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
        navigateDown: function(e){
            let selectionItems = e.target.querySelectorAll('.jstree-checkbox');
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
        render: function(){
            this.$el.html(this.template(this));
            const tree = this.$el.find('#tree');
            tree.jstree({
                core : {
                    data: this.tree, 
                    themes: {'icons': false}},
                checkbox: { 
                    tie_selection : false,
                    real_checkboxes : true,
                },
                plugins : ['checkbox'],
                },
            );
            //Handle checked nodes
            tree.on('check_node.jstree', (e, data) => {
                const selected = this.ignoreParent && data.node.children.length > 0
                    ? data.node.children.map(child => tree.jstree(true).get_node(child).text)
                    : [data.node.text];
                selected.forEach(item => {
                    if (!this.data.selectedResults.includes(item)) {
                        this.data.selectedResults.push(item);
                    }
                });
                this.$el.trigger('updatedLists');
            });
            //Handle unchecked nodes
            tree.on('uncheck_node.jstree', (e, data) => {
                const selected = this.ignoreParent && data.node.children.length > 0
                    ? data.node.children.map(child => tree.jstree(true).get_node(child).text)
                    : [data.node.text];
                this.data.selectedResults = this.data.selectedResults.filter(item => !selected.includes(item));
                this.$el.trigger('updatedLists');
            });
            $('.tree-container').on('focus', this.onFocus.bind(this));
            $('.tree-container').on('blur', this.onBlur.bind(this));
        }
    });
    return TreeSelect;
});
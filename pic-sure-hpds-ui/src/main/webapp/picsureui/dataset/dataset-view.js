define([
    "jquery", "backbone", "handlebars", "underscore", "text!dataset/dataset-view.hbs", "overrides/dataset/dataset-view"
], function(
    $, BB, HBS, _, template, overrides
){
    return BB.View.extend({
        initialize : function(dataset, handlers){
            this.template = HBS.compile(overrides.template ? overrides.template : template);
            this.handlers = handlers;
            this.dataset = JSON.parse(JSON.stringify(dataset));
            this.dataset.query.query = JSON.parse(dataset.query.query);
        },
        events: {
            "click #cancel-btn": "onClose",
            "click #archive-btn": "onArchive"
        },
        mappers: {
            name: {
                path: ['name'],
                renderId: "detail-summary-name"
            },
            uuid: {
                path: ['uuid'],
                renderId: "detail-summary-id"
            },
            categories: {
                path: ['query', 'query', 'query', 'categoryFilters'],
                renderId: "detail-filters",
                render: function(filters = {}){
                    const filtersList = Object.entries(filters);

                    const filterString = filtersList.map(([filter, values]) => {
                        const { category } = /(\\[^\\]+)*\\(?<category>[^\\]+)\\/.exec(filter).groups;
                        return `<span class="list-title">${category}:</span> Restrict values by ${values.join(', ')}`;
                    });
                    return filterString.map(item => `<li>${item}</li>`).join('');
                }
            },
            numeric: {
                path: ['query', 'query', 'query', 'numericFilters'],
                renderId: "detail-filters",
                render: function(filters = {}){
                    const filtersList = Object.entries(filters);

                    const filterString = filtersList.map(([filter, { min, max }]) => {
                        const { category } = /(\\[^\\]+)*\\(?<category>[^\\]+)\\/.exec(filter).groups;
                        const range = [];
                        min && range.push(`Min: ${min}`);
                        max && range.push(`Max: ${max}`);
                        return `<span class="list-title">${category}:</span> Restrict values by ${range.join(', ')}`;
                    });
                    return filterString.map(item => `<li>${item}</li>`).join('');
                }
            },
            selected: {
                path: ['query', 'query', 'query', 'fields'],
                renderId: "detail-variables",
                render: function(variables = []){
                    const variableList = Object.entries(variables.reduce((map, variable) => {
                        const { path, field } = /\\(?<path>.+)\\(?<field>[^\\]+)\\/.exec(variable).groups;
                        const values = map[path] || [];
                        return { ...map, [path]: [ ...values, field] };
                    }, {}));

                    const variableString = variableList.map(([filter, values]) => {
                        const { field } = /([^\\]+\\)*(?<field>[^\\]+)/.exec(filter).groups;
                        return `<span class="list-title">${field}:</span> ${values.join(', ')}`;
                    });

                    return variableString.map(item => `<li>${item}</li>`).join('');
                }
            },
            ...overrides.mappers
        },
        onClose: function() {
            this.handlers.onClose(this);
        },
        onArchive: function() {
            this.handlers.onArchive();
            this.onClose();
        },
        render: function(){
            this.$el.html(this.template(this));

            Object.values(this.mappers).forEach(({ path, renderId, render }) => {
                const data = _.get(this.dataset, path);
                $("#" + renderId).append(render ? render(data) : data);
            });

            overrides.renderExt && overrides.renderExt(this);
        }
    });
});
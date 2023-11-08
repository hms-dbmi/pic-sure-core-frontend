define([
    "jquery", "backbone", "handlebars", "underscore",
    "text!dataset/dataset-view.hbs", "overrides/dataset/dataset-view",
    "dataset/utilities", "common/modal"
], function(
    $, BB, HBS, _,
    template, overrides,
    dataUtils, modal
){
    return BB.View.extend({
        initialize : function(dataset, handlers){
            this.template = HBS.compile(overrides.template ? overrides.template : template);
            this.handlers = handlers;
            this.dataset = JSON.parse(JSON.stringify(dataset));
        },
        events: {
            "click #dataset-view-cancel-btn": "onClose",
            "click #dataset-view-archive-btn": "onArchive",
            "click #dataset-view-download-btn": "onDownload"
        },
        mappers: function() {
            const map = {
                name: {
                    path: ['name'],
                    renderId: "detail-summary-name"
                },
                uuid: {
                    path: ['query', 'uuid'],
                    renderId: "detail-summary-id"
                },
                anyRecordOf: {
                    path: ['query', 'anyRecordOf'],
                    renderId: "detail-filters",
                    render: function(filtersList = []){
                        const data = dataUtils.format.anyRecordOf(filtersList);
                        return dataUtils.render.html(data)
                            .map(item => `<li>${item}</li>`).join('');
                    }
                },
                anyRecordOfMulti: {
                    path: ['query', 'anyRecordOfMulti'],
                    renderId: "detail-filters",
                    render: function(filtersList = []){
                        const data = dataUtils.format.anyRecordOfMulti(filtersList);
                        return dataUtils.render.html(data)
                            .map(item => `<li>${item}</li>`).join('');
                    }
                },
                categories: {
                    path: ['query', 'categoryFilters'],
                    renderId: "detail-filters",
                    render: function(filtersList = []){
                        const data = dataUtils.format.categories(filtersList);
                        return dataUtils.render.html(data, "Restrict values by ")
                            .map(item => `<li>${item}</li>`).join('');
                    }
                },
                numeric: {
                    path: ['query', 'numericFilters'],
                    renderId: "detail-filters",
                    render: function(filtersList = []){
                        const data = dataUtils.format.numeric(filtersList);
                        return dataUtils.render.html(data, "Restrict values by ")
                            .map(item => `<li>${item}</li>`).join('');
                    }
                },
                genomic: {
                    path: ['query', 'variantInfoFilters'],
                    renderId: "detail-filters",
                    render: function(filtersList = []){
                        const filterString = [];
                        filtersList.map(({ numericVariantInfoFilters, categoryVariantInfoFilters }) => {
                            if(!_.isEmpty(categoryVariantInfoFilters)){
                                const variants = dataUtils.format.categoryVariant(categoryVariantInfoFilters);
                                filterString.push(dataUtils.render.html(variants).join('<br />'));
                            }
                            if(!_.isEmpty(numericVariantInfoFilters)){
                                const variants = dataUtils.format.numericVariant(numericVariantInfoFilters);
                                dataUtils.render.html(variants).map(variant => filterString.push(variant));
                            }
                        });
                        return filterString.map(item => `<li>${item}</li>`).join('');
                    }
                },
                selected: {
                    path: ['query', 'fields'],
                    renderId: "detail-variables",
                    render: function(variableList = []){
                        const data = dataUtils.format.selectedVariables(variableList);
                        return dataUtils.render.html(data)
                            .map(item => `<li>${item}</li>`).join('');
                    }
                }
            };
            return overrides.mappers ? overrides.mappers(map, this) : map;
        },
        onClose: function() {
            this.handlers.onClose(this);
        },
        onDownload: function() {
            this.handlers.onDownload();
        },
        onArchive: function() {
            this.handlers.onArchive();
            this.onClose();
        },
        render: function(){
            this.$el.html(this.template(this));

            Object.values(this.mappers()).forEach(({ path, renderId, render }) => {
                const data = _.get(this.dataset, path);
                data && $("#" + renderId).append(render ? render(data) : data);
            });

            // remove elements that could be empty
            !this.dataset.name && $("#detail-summary-name").parent().remove();
            if($.trim($("#detail-filters").html()) == ''){
                $("#detail-filters-container").remove();
            }
            if($.trim($("#detail-variables").html()) == ''){
                $("#detail-variables-container").remove();
            }

            // Remove buttons we don't need
            !this.handlers.onArchive && $("#dataset-view-archive-btn").parent().remove();
            !this.handlers.onDownload && $("#dataset-view-download-btn").parent().remove();

            // Set the column spacing based on the buttons that are still available
            const buttons = $("#buttons > div");
            const cols = Math.floor(12 / buttons.length);
            buttons.each(function(){
                $(this).addClass(`col-lg-${cols}`);
            });

            overrides.renderExt && overrides.renderExt(this);
            modal.createTabIndex(); // always do this at end
        }
    });
});
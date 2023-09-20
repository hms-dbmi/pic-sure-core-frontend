define(["backbone", "handlebars", "text!common/googleAnalytics.hbs", "picSure/settings"],
    function (BB, HBS, template, settings) {
        var googleAnalytics = BB.View.extend({
            initialize: function () {
                this.template = HBS.compile(template);
            },
            render: function () {
                let analyticsId = settings.analyticsId;
                if (analyticsId === undefined || analyticsId === "__ANALYTICS_ID__") {
                    analyticsId = false;
                }

                this.$el.html(this.template({analyticsId: analyticsId}));
            }
        });

        return {
            View: googleAnalytics
        };
    });

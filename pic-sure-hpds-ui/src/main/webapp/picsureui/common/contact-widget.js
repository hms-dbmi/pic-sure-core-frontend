define(["backbone", "handlebars", "text!common/contact-widget.hbs", "picSure/settings"],
    function (BB, HBS, template, settings) {
        var contactWidget = BB.View.extend({
            initialize: function () {
                this.template = HBS.compile(template);
            },
            events: {},
            render: function () {
                const key = settings.contactKey && settings.contactKey !== "__CONTACT_KEY__" ? settings.contactKey : false;
                // if neither analyticsId nor tagManagerId are set, don't render anything
                if (!key) {
                    return;
                }

                this.$el.html(this.template({key: "839c6f3d-d032-4821-ba57-e59ba6e68abd"}));
            }
        });

        return {
            View: contactWidget
        };
    });

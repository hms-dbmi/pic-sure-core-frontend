define(["backbone","handlebars", "text!footer/googleAnalytics.hbs", "picSure/settings"],
    function(BB, HBS, template, settings){
        var googleAnalytics = BB.View.extend({
            initialize : function(){
                this.template = HBS.compile(template);
                this.settings = settings;
            },
            render : function(){
                this.$el.html(this.template({ analyticsId : this.settings.analyticsId }));
            }
        });

        return {
            View : googleAnalytics
        };
    });
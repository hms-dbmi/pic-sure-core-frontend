define(["backbone", "handlebars", "text!common/googleAnalytics.hbs", "picSure/settings", "analytics/cookie-consent"],
    function (BB, HBS, template, settings, cookieConsent) {
        var googleAnalytics = BB.View.extend({
            initialize: function () {
                this.template = HBS.compile(template);
            },
            events: {},
            displayCookieConsent: function () {
                const cookieBanner = new cookieConsent();
                cookieBanner.render();
                $("#cookie-consent-container").html(cookieBanner.$el);
                $("#cookie-consent-banner").show();
            },
            render: function () {
                let analyticsId = settings.analyticsId;
                if (analyticsId === undefined || analyticsId === "__ANALYTICS_ID__") {
                    analyticsId = false;
                }

                this.$el.html(this.template({analyticsId: analyticsId}));
                if (analyticsId && localStorage.getItem('consentMode') === null) {
                    //this.displayCookieConsent();
                }
            }
        });

        return {
            View: googleAnalytics
        };
    });

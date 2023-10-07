define(["backbone", "handlebars", "text!analytics/googleAnalytics.hbs", "picSure/settings", "analytics/cookie-consent"],
    function (BB, HBS, template, settings, cookieConsent) {
        var googleAnalytics = BB.View.extend({
            initialize: function () {
                this.template = HBS.compile(template);
            },
            events: {},
            displayCookieConsent: function () {
                const cookieBanner = new cookieConsent();
                cookieBanner.render();
                $("#cookie-consent-container").append(cookieBanner.$el);
            },
            render: function () {
                let analyticsId = settings.analyticsId && settings.analyticsId !== "__ANALYTICS_ID__" ? settings.analyticsId : false;
                let tagManagerId = settings.tagManagerId && settings.tagManagerId !== "__TAG_MANAGER_ID__" ? settings.tagManagerId : false;
                // if neither analyticsId nor tagManagerId are set, don't render anything
                if (!tagManagerId && !analyticsId) {
                    return;
                }

                this.$el.html(this.template({analyticsId: analyticsId, tagManagerId: settings.tagManagerId}));
                if (analyticsId && localStorage.getItem('consentMode') === null) {
                    this.displayCookieConsent();
                }
            }
        });

        return {
            View: googleAnalytics
        };
    });

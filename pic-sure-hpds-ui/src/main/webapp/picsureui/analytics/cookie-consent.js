define([
    'backbone',
    'handlebars',
    'text!analytics/cookie-consent.hbs',
    "picSure/settings",
], function(BB, HBS, viewTemplate, settings) {
    const CookieBanner = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(viewTemplate);
        },
        events: {
            'click #cookie-consent-acceptAll' : 'acceptAll',
            'click #cookie-consent-accept-necessary' : 'acceptNecessary',
            'click #cookie-consent-accept-some' : 'accept',
            'click #cookie-consent-reject' : 'rejectAll',
        },
        acceptAll: function(){
            this.setConsent({
                necessary: true,
                preferences: true,
                analytics: true,
                marketing: true,
            });
            this.hideBanner();
        },
        acceptNecessary: function(){
            this.setConsent({
                necessary: true,
                preferences: false,
                analytics: false,
                marketing: false,
            });
        },
        accept: function(){
            this.setConsent({
                necessary: $('#consent-necessary').is(':checked'),
                preferences: $('#consent-necessary').is(':checked'),
                analytics: $('#consent-necessary').is(':checked'),
                marketing: $('#consent-necessary').is(':checked'),
            });
            this.hideBanner();
        },
        rejectAll: function(){
            this.setConsent({
                necessary: false,
                preferences: false,
                analytics: false,
                marketing: false,
            });
            this.hideBanner();
        },
        setConsent(consent) {
            const consentMode = {
              'functionality_storage': consent.necessary ? 'granted' : 'denied',
              'security_storage': consent.necessary ? 'granted' : 'denied',
              'ad_storage': 'denied',
              'analytics_storage': consent.analytics ? 'granted' : 'denied',
              'personalization': consent.preferences ? 'granted' : 'denied',
            };
            gtag('consent', 'update', consent);  
            localStorage.setItem('consentMode', JSON.stringify(consentMode));
        },
        hideBanner: function() {
            this.$el.hide();
        },
        render: function(){
            if (!settings.analyticsId || settings.analyticsId === "__ANALYTICS_ID__" || settings.analyticsId === "") {
                return;
            }
            this.$el.html(this.template(this));
            $("#btn-accept-all").focus();
        }
    });
    return CookieBanner;
});
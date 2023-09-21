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
            'click #cookie-consent-accept-all' : 'acceptAll',
            'click #cookie-consent-accept-some' : 'accept',
            'click #cookie-consent-reject-all' : 'rejectAll',
            'click #close-cookie-popup' : 'acceptNecessary',
        },
        acceptAll: function(){
            this.setConsent({
                necessary: true,
                preferences: true,
                analytics: true,
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
            this.hideBanner();
        },
        accept: function(){
            this.setConsent({
                necessary: $('#consent-necessary').is(':checked'),
                preferences: $('#consent-preferences').is(':checked'),
                analytics: $('#consent-analytics').is(':checked'),
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
            $('#cookie-consent-container').remove();
        },
        render: function(){
            if (!settings.analyticsId || settings.analyticsId === "__ANALYTICS_ID__" || settings.analyticsId === "") {
                return;
            }
            this.$el.html(this.template());
            // $("#btn-accept-all").focus();
        }
    });
    return CookieBanner;
});
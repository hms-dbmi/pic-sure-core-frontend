define(["jquery", "backbone", "handlebars", "text!header/banner.hbs"], function ($, Backbone, HBS, template) {
    return Backbone.View.extend({
        tagName: 'div',
        id: 'banner',

        initialize: function (options) {
            this.bannerText = options.bannerText;
            this.bannerStyles = options.bannerStyles;
            this.isDismissible = options.isDismissible;
            this.bannerClass = options.class;
            this.bannerCount = options.bannerCount;
            this.template = HBS.compile(template);
        },
        events: {
            'click #closeBannerBtn': 'closeBanner' // Handle click event
        },
        closeBanner: function () {
            this.$el.hide(); // Hide the banner on close button click
            sessionStorage.setItem('bannerDismissed_' + this.bannerCount, 'true');
        },
        render: function () {
            // Check if the banner has been dismissed in this session
            if (sessionStorage.getItem('bannerDismissed_' + this.bannerCount) === 'true') {
                return this;
            }

            if (!this.bannerText) {
                // Do not render the banner if text is missing
                return this;
            }

            this.$el.html(this.template({
                bannerText: this.bannerText,
                bannerStyles: this.bannerStyles,
                isDismissible: this.isDismissible,
                bannerClass: this.bannerClass,
                bannerCount: this.bannerCount
            }));

            // Set the color of the close button based on the background color of the banner
            const backgroundColor = this.$('#banner').css('background-color');

            // Check if the background color is white or black. We cannot be sure if rgb, rgba, hex, or named color is used
            const isWhiteBackground = backgroundColor === 'rgb(255, 255, 255)' || backgroundColor === 'rgba(255, 255, 255, 0)' || backgroundColor === '#ffffff' || backgroundColor === 'white';
            this.$('#closeBannerBtn').css('color', isWhiteBackground ? 'black' : 'white');

            return this;
        },
    });
});
define(["jquery", "backbone","handlebars", "text!header/header.hbs", "overrides/header", "text!../settings/settings.json", "common/transportErrors"],
		function($, BB, HBS, template, overrides, settings, transportErrors){
	var headerView = BB.View.extend({
		initialize : function(){
			this.template = HBS.compile(template);
		},
		events : {
			"click #logout-btn" : "logout"
		},
		logout : function(event){
			sessionStorage.clear();
			window.location = transportErrors.redirectionUrl;
		},
		render : function(){
			jsonSettings = JSON.parse(settings);
			this.$el.html(this.template({
				logoPath: (overrides.logoPath
					? overrides.logoPath : "/images/logo.png"),
				helpLink: jsonSettings.helpLink,
				pdfLink: jsonSettings.pdfLink,
				videoLink: jsonSettings.videoLink
			}));
			$.ajax({
				url: window.location.origin + "/psama/user/me",
				type: 'GET',
				headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
				contentType: 'application/json',
				success: function(response){
					if(response.privileges.includes("ADMIN") || response.privileges.includes("SUPER_ADMIN")){
						$('#admin-btn', this.$el).show();
					} else {
						$('#user-profile-btn', this.$el).show();
					}
				}.bind(this),
				error: function(response){
                    transportErrors.handleAll(response, "error retrieving user info");
				}.bind(this)
			});
		}
	});

	return {
		View : new headerView({})
	};
});

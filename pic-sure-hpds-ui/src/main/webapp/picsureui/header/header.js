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
			window.location = '/psamaui?redirection_url=/picsureui';
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
					console.log("error retrieving user info");
					console.log(response);
                    transportErrors.handleAll(response);
				}.bind(this)
			});
		}
	});

	return {
		View : new headerView({})
	};
});

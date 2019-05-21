define(["backbone","handlebars", "auth/login", "text!header/header.hbs", "overrides/header", "settings"], 
		function(BB, HBS, login, template, overrides, settings){
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
			this.$el.html(this.template({
				logoPath: (overrides.logoPath 
					? overrides.logoPath : "/images/PrecisionLinkPortal.png"),
				helpLink: settings.helpLink
			}));
			$.ajax({
				url: window.location.origin + "/picsureauth/user/me",
				type: 'GET',
				headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
				contentType: 'application/json',
				success: function(response){
					if(response.privileges.includes("ADMIN") || response.privileges.includes("SUPER_ADMIN")){
						$('#admin-btn', this.$el).show();
					}
				}.bind(this),
				error: function(response){
					console.log("error retrieving user info");
					console.log(response);
				}.bind(this)
			});
		}
	});

	return {
		View : new headerView({})
	};
});

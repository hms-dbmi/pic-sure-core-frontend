define(["filter/filterList", "header/header", "footer/footer", "text!../settings/settings.json", "output/outputPanel", "picSure/resourceMeta", "jquery", "handlebars", "text!common/mainLayout.hbs", "treeview", "common/styles"],
	function(filterList, header, footer, settings, output, resourceMeta, $, HBS, layoutTemplate){
		var redirection_url = "/psamaui/login?redirection_url=" + "/picsureui/";
		return function(){
			if(window.location.pathname !== "/picsureui/"){
				window.location = "/picsureui/";
			}
			var session = JSON.parse(sessionStorage.getItem("session"));
			if(!session || !session.token){
				window.location = redirection_url;
			}
			$.ajax({
				url: window.location.origin + '/picsure/info/resources',
				headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
				contentType: 'application/json',
				type:'GET',
				success: function(){
					console.log("login successful");
					$.ajaxSetup({
						error: function(event, jqxhr){
							console.log(jqxhr);
							window.location = redirection_url;
						}
					});

					$.ajax({
			        url: window.location.origin + "/psama/user/me/queryTemplate/" + JSON.parse(settings).applicationIdForBaseQuery,
			        type: 'GET',
			        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
			        contentType: 'application/json',
			        success: function (response) {
			        	var session = JSON.parse(sessionStorage.getItem("session"));
			            session.queryTemplate = response.queryTemplate;
			            sessionStorage.setItem("session", JSON.stringify(session));
			        }.bind(this),
			        error: function (response) {
			        	if (response.status == 401) {
			             localStorage.clear();
			             window.location = redirection_url;
								}
			          console.log("Cannot retrieve query template with status: " + response.status);
			          console.log(response);
			        }.bind(this)
			    });

					$('body').append(HBS.compile(layoutTemplate)(JSON.parse(settings)));
					var headerView = header.View;
					headerView.render();
					$('#header-content').append(headerView.$el);
					var footerView = footer.View;
					footerView.render();
					$('#footer-content').append(footerView.$el);
					filterList.init();
					var outputPanel = output.View;
					outputPanel.render();
					$('#query-results').append(outputPanel.$el);
				},
				error: function(jqXhr){
					if(jqXhr.status === 401){
						localStorage.clear();
						window.location = redirection_url;
					}else{
						console.log("ERROR in startup.js!!!");
						window.location = redirection_url;
					}
				},
				dataType: "json"
			});
		}
	});

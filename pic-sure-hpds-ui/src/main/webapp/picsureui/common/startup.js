define(["jquery", "filter/filterList", "header/header", "footer/footer", "text!../settings/settings.json", "output/outputPanel", "handlebars", "text!common/mainLayout.hbs", "picSure/queryBuilder", "treeview", "common/styles", "common/transportErrors"],
	function($, filterList, header, footer, settings, output, HBS, layoutTemplate, queryBuilder, transportErrors){
		return function(){
			if(window.location.pathname !== "/picsureui/"){
				window.location = "/picsureui/";
			}
			var session = JSON.parse(sessionStorage.getItem("session"));
			if(!session || !session.token){
				window.location = transportErrors.redirectionUrl;
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
							console.log(jqxhr + ": " + event.status);
							if(event.status == 401) {
								window.location = transportErrors.redirectionUrl;
							}
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
						
			            var query = queryBuilder.createQuery({});
			            outputPanel.update(query);
			        }.bind(this),
			        error: function (response) {
                        transportErrors.handle401(response);
                        console.log("Cannot retrieve query template with status: " + response.status);
                        console.log(response);
			        }.bind(this)
			    });

				},
				error: function(jqXhr){
				    if (!transportErrors.handle401(response)) {
                        console.log("ERROR in startup.js!!!");
                        window.location = transportErrors.redirectionUrl;
                    }
				},
				dataType: "json"
			});
		}
	});

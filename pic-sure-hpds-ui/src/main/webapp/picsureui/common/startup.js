define(["jquery", "common/transportErrors", "filter/filterList", "header/header", "footer/footer", "text!../settings/settings.json", "output/outputPanel", "handlebars", "text!common/mainLayout.hbs", "picSure/queryBuilder", "treeview", "common/styles"],
	function($, transportErrors, filterList, header, footer, settings, output, HBS, layoutTemplate, queryBuilder){
		return function(){
			var session = JSON.parse(sessionStorage.getItem("session"));
			if(!session || !session.token){
			    transportErrors.handleAll({status: 401}, "Session is missing token");
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

					//create the queryBuilder UI after checking for a query template
					var renderMain = function(){
			            $('#main-content').append(HBS.compile(layoutTemplate)(JSON.parse(settings)));
			            filterList.init();
			            var outputPanel = output.View;
			            outputPanel.render();
			            $('#query-results').append(outputPanel.$el);
						
			            var query = queryBuilder.createQuery({});
			            outputPanel.runQuery(query);
					};
					
					$.ajax({
			        url: window.location.origin + "/psama/user/me/queryTemplate/" + JSON.parse(settings).applicationIdForBaseQuery,
			        type: 'GET',
			        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
			        contentType: 'application/json',
			        success: function (response) {
			        	var session = JSON.parse(sessionStorage.getItem("session"));
			            session.queryTemplate = response.queryTemplate;
			            sessionStorage.setItem("session", JSON.stringify(session));
			            renderMain();
			        }.bind(this),
			        error: function (response) {
                        console.log("unable to retrieve query template"); //don't error here; most instances have no templates
                        renderMain();
			        }.bind(this)
			    });

				},
				error: function(jqXhr){
				    transportErrors.handleAll(jqXhr, "ERROR in startup.js!");
				},
				dataType: "json"
			});
		}
	});

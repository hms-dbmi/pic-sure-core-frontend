define(["header/header", "picSure/userFunctions", "picSure/applicationFunctions", "jquery","underscore"],
		function(header, userFunctions, applicationFunctions, $, _){
	// Register the pretty print for matcher debugs
	jasmine.pp = function(obj){return JSON.stringify(obj, undefined, 2);};
	var headerView  = new header.View();
	headerView.render();
	describe("header", function(){
		describe("is a valid RequireJS module", function(){
			it("returns an object", function(){
				expect(typeof header).toEqual("object");
			});
			describe("has a logout function", function(){
				it("clears the sessionStorage and localStorage when invoked", function(){
					sessionStorage.setItem("foo", "bar");
					localStorage.setItem("bar", "foo");
					sessionStorage.setItem("redirection_url", "testvalue")
					new header.View().logout();
					expect(_.keys(localStorage)).toEqual([]);
					expect(_.keys(sessionStorage)).toEqual(["redirection_url"]);
				});
			});

			// The following tests require changes to header.js which is not 
			// in scope for the current ticket. A new ticket has been generated 
			// for this fix().
			//
			// Basically there is not a good way to spy on the change in state
			// because the window.location = on line 21 refreshes the browser.
			//
			// Consider instead using a history.pushState call which can be spied on

//			describe("has a gotoLogin function", function(){
//				var logoutSpy;
//				it("invokes the logout function when invoked", function(){
//					logoutSpy = spyOn(new header.View(), "logout");
//					new header.View().gotoLogin();
//					expect(new header.View().logout).toHaveBeenCalled();
//				});
//
//				it("sends the user to the login page", function(){
//				logoutSpy = spyOn(history, "pushState");
//				new header.View().gotoLogin();
//				expect(history.pushState).toHaveBeenCalled();
//				/* reset the url in the browser for developer sanity
//				* this way you can refresh the browser after one test run
//				*/
//				history.replaceState(undefined,"","/");
//				});
//			});
		
			describe("has a render function", function(){
				var userFunctionsSpy;
				var applicationFunctionsSpy;
				it("doesn't call userFunctions.me if on the tos page", function(){
					history.replaceState(undefined, "","/psamaui/tos");
					userFunctionsSpy = spyOn(userFunctions, "me");
					new header.View().render();
					expect(userFunctions.me.calls.any()).toEqual(false);
					history.replaceState(undefined, "","/");
				});
				
				/*  The functionality of calling user/me was duplicated in the header-footer refactor, this should be switched back to
					use the userFunctions function. Once it is switched back this test should be reenabled.
					
				it("calls userFunctions.me if not on the tos page", function(){
					userFunctionsSpy = spyOn(userFunctions, "me");
					new header.View().render();
					expect(userFunctions.me.calls.count()).toEqual(1);
				});
				*/
				
				describe("renders correctly", function(){
					it("shows the Super Admin Console button for SUPER_ADMIN users", function(){
						userFunctionsSpy = spyOn(userFunctions, "me").and
						.callFake(function(object, callback){
							callback({privileges: ['SUPER_ADMIN']});
						});
						applicationFunctionsSpy = spyOn(applicationFunctions, "fetchApplications").and
						.callFake(function(object, callback){
							callback([{}]);
						});
						headerView.render();
						expect($('a[data-href="/psamaui/roleManagement"]', headerView.$el).length).toEqual(1);
					});
					it("hides the Super Admin Console button for regular ADMIN users", function(){
						userFunctionsSpy = spyOn(userFunctions, "me").and
						.callFake(function(object, callback){
							callback({privileges: ['ADMIN']});
						});
						applicationFunctionsSpy = spyOn(applicationFunctions, "fetchApplications").and
						.callFake(function(object, callback){
							callback([{}]);
						});
						headerView.render();
						expect($('#super-admin-dropdown[style="display: none;"]', headerView.$el).length).toEqual(1);
					});
					it("shows the Users button for ADMIN users", function(){
						userFunctionsSpy = spyOn(userFunctions, "me").and
						.callFake(function(object, callback){
							callback({privileges: ['ADMIN']});
						});
						applicationFunctionsSpy = spyOn(applicationFunctions, "fetchApplications").and
						.callFake(function(object, callback){
							callback([{}]);
						});
						headerView.render();
						expect($('a[data-href="/psamaui/userManagement"]', headerView.$el).length).toEqual(1);
					});
					it("hides the Users button for non-ADMIN users", function(){
						userFunctionsSpy = spyOn(userFunctions, "me").and
						.callFake(function(object, callback){
							callback({privileges: ['SUPER_ADMIN', 'SYSTEM','RESEARCHER','blahblah']});
						});
						applicationFunctionsSpy = spyOn(applicationFunctions, "fetchApplications").and
						.callFake(function(object, callback){
							callback([{}]);
						});
						headerView.render();
						expect($('a[data-href="/psamaui/userManagement"][style="display: none;"]', headerView.$el).length).toEqual(1);
					});
					// Since it is possible that admin users would not have access to picsure, perhaps this is the wrong approach
					// That is not an issue related to the current ticket and those discussions will not be happening now.
					// it("shows the PIC-SURE UI button without needing any specific roles", function(){
					// 	userFunctionsSpy = spyOn(userFunctions, "me").and
					// 	.callFake(function(object, callback){
					// 		callback({privileges: []});
					// 	});
					// 	new header.View().render();
					// 	expect($('a[href="/picsureui"]', new header.View().$el).length).toEqual(1);
					// });
					
					/*  This test is invalid right now because the Applications are no longer being added
						to the Handlebars context used to render the header. They should be added back in
						and this test should be enabled once they are.
						
					it("shows application in Applications dropdown when at least one application has a link", function(){
						userFunctionsSpy = spyOn(userFunctions, "me").and
							.callFake(function(object, callback){
								callback({privileges: []});
							});
						applicationFunctionsSpy = spyOn(applicationFunctions, "fetchApplications").and
							.callFake(function(object, callback){
								callback([{uuid: 'app-uuid', name:'PICSURE-UI', url: '/picsureui'}]);
							});
						headerView.render();
						expect($('#applications-dropdown li a[href="/picsureui"]', headerView.$el).length).toEqual(1);
					});
					 */
					it("do not display any application in Applications dropdown when neither application has a link", function(){
						userFunctionsSpy = spyOn(userFunctions, "me").and
							.callFake(function(object, callback){
								callback({privileges: []});
							});
						applicationFunctionsSpy = spyOn(applicationFunctions, "fetchApplications").and
							.callFake(function(object, callback){
								callback([	{uuid: 'app-uuid-1', name:'PICSURE', url: ''},
											{uuid: 'app-uuid-2', name:'FRACTALIS', url: ''}]);
							});
						headerView.render();
						expect($('#applications-dropdown li', headerView.$el).length).toEqual(0);
					});
					describe("renders a Log Out button ", function(){
						it("Log Out button is rendered and has id logout-btn", function(){
							userFunctionsSpy = spyOn(userFunctions, "me").and
							.callFake(function(object, callback){
								callback({privileges: []});
							});
							applicationFunctionsSpy = spyOn(applicationFunctions, "fetchApplications").and
							.callFake(function(object, callback){
								callback([{}]);
							});
							var headerView = new header.View();
							headerView.render();
							expect($('a#logout-btn', headerView.$el).length).toEqual(1);
						});
						var logoutSpy;
						
						// See comment above regarding the window.location issue in header.js
						
//						it("when clicked the Log Out button triggers the new header.View().logout function", function(){
//							logoutSpy = spyOn(new header.View(), "logout");
//							userFunctionsSpy = spyOn(userFunctions, "me").and
//							.callFake(function(object, callback){
//								callback({privileges: []});
//							});
//							new header.View().render();
//							$('a#logout-btn', new header.View().$el).click();
//							expect(new header.View().logout).toHaveBeenCalled();
//							history.replaceState(undefined,"","/");
//						});
					});
				});
			});
		});

	});
});

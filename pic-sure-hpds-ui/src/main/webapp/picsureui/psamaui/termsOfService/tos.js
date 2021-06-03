define(["backbone","handlebars", "text!termsOfService/tos.hbs", "picSure/picsureFunctions", 'common/session'],
    function(BB, HBS, template, picsureFunctions, session){
        var tosModel = BB.Model.extend({
        });

        var tosView = BB.View.extend({
            template : HBS.compile(template),
            events : {
                "click .accept-tos-button":   "acceptTOS",
            },
            acceptTOS: function () {
                picsureFunctions.acceptTOS(function(){
                    this.toggleNavigationButtons(false);
                    session.setAcceptedTOS();
                    
                    //need to update the template and user data - see login.js
                    var queryTemplateRequest = function() {
        	            return $.ajax({
        	                url: window.location.origin + "/psama/user/me/queryTemplate/" + picSureSettings.applicationIdForBaseQuery,
        	                type: 'GET',
        	                headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
        	                contentType: 'application/json'
        	            });
        	        };
        	        var meRequest = function () {
        	            return $.ajax({
        	                url: window.location.origin + "/psama/user/me",
        	                type: 'GET',
        	                headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
        	                contentType: 'application/json'
        	            });
        	        };
        	        $.when(queryTemplateRequest(), meRequest()).then(
        	            function(queryTemplateResponse, meResponse) {
        	                var currentSession = JSON.parse(sessionStorage.getItem("session"));
        	                currentSession.queryTemplate = queryTemplateResponse[0].queryTemplate;
        	                currentSession.privileges = meResponse[0].privileges;
        	                sessionStorage.setItem("session", JSON.stringify(currentSession));
        	
        	                if (sessionStorage.redirection_url && sessionStorage.redirection_url != 'undefined') {
        	                    window.location = sessionStorage.redirection_url;
        	                }
        	                else {
        	                	 history.pushState({}, "", "psamaui/userManagement");
        	                }
        	            }.bind(this),
        	            function(queryTemplateResponse, meResponse) {
        	                if (queryTemplateResponse[0] && queryTemplateResponse[0].status !== 200)
        	                    transportErrors.handleAll(queryTemplateResponse[0], "Cannot retrieve query template with status: " + queryTemplateResponse[0].status);
        	                else
        	                    transportErrors.handleAll(meResponse[0], "Cannot retrieve user with status: " + meResponse[0].status);
        	            }
        	        );
                    
                    
                    
                    
                }.bind(this))
            },
            toggleNavigationButtons: function(disable) {
                if (disable) {
                    $("#userMgmt-header").removeAttr('href');
                    $("#cnxn-header").removeAttr('href');
                    $("#userMgmt-header").attr('title', 'You must accept the terms of service before using other pages.');
                    $("#cnxn-header").attr('title', 'You must accept the terms of service before using other pages.');
                } else {
                    $("#userMgmt-header").attr("href","/userManagement");
                    $("#cnxn-header").attr("href","/connectionManagement");
                    $("#userMgmt-header").removeAttr('title');
                    $("#cnxn-header").removeAttr('title');
                }
            },
            render : function(){
                picsureFunctions.getLatestTOS(function (content) {
                    this.model.set("content", content);
                    this.$el.html(this.template({content: content}));
                    this.toggleNavigationButtons(true);
                }.bind(this));
            }
        });

        return {
            View : tosView,
            Model: tosModel
        };
});
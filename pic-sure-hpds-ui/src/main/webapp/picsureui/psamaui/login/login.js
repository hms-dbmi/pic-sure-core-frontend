define(['common/session', 'picSure/psamaSettings', 'common/searchParser', 'jquery', 'handlebars', 'login/loginButtons',
        'text!login/not_authorized.hbs', 'psamaui/overrides/login', 'util/notification',
        "picSure/settings", 'common/transportErrors','text!login/connections.json'],
		function(session, psamaSettings, parseQueryString, $, HBS, loginButtons,
                 notAuthorizedTemplate, overrides, notification,
                 picSureSettings, transportErrors, connectionsStr){

    var connections = JSON.parse(connectionsStr);

	var showNormalLogin = function(){
        console.log("Auth0-showLoginPage()");

        var queryObject = parseQueryString();
        if (queryObject.redirection_url) sessionStorage.redirection_url = queryObject.redirection_url.trim();
        if (queryObject.not_authorized_url) sessionStorage.not_authorized_url = queryObject.not_authorized_url.trim();
        var redirectURI = window.location.protocol
            + "//"+ window.location.hostname
            + (window.location.port ? ":"+window.location.port : "")
            + "/picsureui/login/";
        if(typeof queryObject.access_token === "string"){
            if (overrides.waitingMessage) {
                $('#main-content').html(overrides.waitingMessage);
            }
            $.ajax({
                url: '/psama/authentication',
                type: 'post',
                data: JSON.stringify({
                    access_token : queryObject.access_token,
                    redirectURI: redirectURI
                }),
                contentType: 'application/json',
                success: sessionInit,
                error: handleAuthenticationError
            });
        } else{
            if (!psamaSettings.client_id){
                notification.showFailureMessage("Client_ID is not provided. Please update overrides/login.js file.");
            }
            var clientId = psamaSettings.client_id;

            // The setting 'customizeAuth0Login' directs the UI to render individual buttons for the oauth login screen
            // if this setting is false, then the standard Auth0 Lock (an email/password entry form) is used.
            // Some institutions require a username instead of an email for login; the Lock workflow would then require
            // the users to enter their credentials twice;  we can avoid that by using buttons only (customize == true)
            if (psamaSettings.customizeAuth0Login){
                var oauthOptions = {
                    clientID : clientId,
                    domain : 'avillachlab.auth0.com',
                    redirectUri : redirectURI,
                    responseType: 'token'
                };
                $('#main-content').html("<div id='frmAuth0Login'></div>");
                loginButtons.showLockButtons(connections, oauthOptions);
                overrides.postRender ? overrides.postRender.apply(this) : undefined;
            } else {
                require(['auth0Lock'], function(Auth0Lock){
                    var lock = new Auth0Lock(
                        clientId,
                        psamaSettings.auth0domain + ".auth0.com",
                        {
                            auth: {
                                redirectUrl: redirectURI,
                                responseType: 'token',
                                params: {
                                    scope: 'openid email' // Learn about scopes: https://auth0.com/docs/scopes
                                }
                            }
                        }
                    );
                    lock.show();
                });
            }
        }
    };

    var sessionInit = function(data) {
        session.authenticated(data.userId, data.token, data.email, data.permissions, data.acceptedTOS, this.handleNotAuthorizedResponse);
        if (data.acceptedTOS !== 'true'){
            history.pushState({}, "", "/psamaui/tos");
        } else {
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
	                    window.location = "/picsureui/"
	                }
	            }.bind(this),
	            function(queryTemplateResponse, meResponse) {
	                if (queryTemplateResponse[0] && queryTemplateResponse[0].status !== 200)
	                    transportErrors.handleAll(queryTemplateResponse[0], "Cannot retrieve query template with status: " + queryTemplateResponse[0].status);
	                else
	                    transportErrors.handleAll(meResponse[0], "Cannot retrieve user with status: " + meResponse[0].status);
	            }
	        );
        }
    };

	var handleAuthenticationError = function(data){
        notification.showFailureMessage("Failed to authenticate with provider. Try again or contact administrator if error persists.")
        history.pushState({}, "", sessionStorage.not_authorized_url? sessionStorage.not_authorized_url : "/psamaui/not_authorized?redirection_url=/picsureui");
    };

	return {
		showLoginPage : overrides.showLoginPage ? overrides.showLoginPage : showNormalLogin,
        displayNotAuthorized : function () {
            console.log("displayNotAuthorized()");
            if (overrides.displayNotAuthorized)
                overrides.displayNotAuthorized()
            else {
                sessionStorage.clear();
                localStorage.clear();
                $('#main-content').html(HBS.compile(notAuthorizedTemplate)({helpLink:picSureSettings.helpLink}));
            }
        }
    }
});

define(['common/session', "picSure/psamaSettings", "picSure/settings", 'common/searchParser', 'jquery', 'handlebars', 'login/loginButtons', 'text!login/not_authorized.hbs', 'psamaui/overrides/login', 'util/notification', 'psamaui/login/fence_login','text!login/connections.json'],
		function(session, settings, picsureSettings, parseQueryString, $, HBS, loginButtons, notAuthorizedTemplate, overrides, notification, fenceLogin, connectionsStr){

	var connections = JSON.parse(connectionsStr);
	var login = {
		showLoginPage : function(){
		    console.log("Auth0-showLoginPage()");

            var queryObject = parseQueryString();
            if (queryObject.redirection_url) sessionStorage.redirection_url = queryObject.redirection_url.trim();
            if (queryObject.not_authorized_url) sessionStorage.not_authorized_url = queryObject.not_authorized_url.trim();
            var redirectURI = window.location.protocol
                            + "//"+ window.location.hostname
                            + (window.location.port ? ":"+window.location.port : "")
                            + "/psamaui/login/";
            if(typeof queryObject.access_token === "string"){
                $.ajax({
                    url: '/psama/authentication',
                    type: 'post',
                    data: JSON.stringify({
                        access_token : queryObject.access_token,
                        redirectURI: redirectURI
                    }),
                    contentType: 'application/json',
                    success: function(data){
                        session.authenticated(data.userId, data.token, data.email, data.permissions, data.acceptedTOS, this.handleNotAuthorizedResponse);
                        if (data.acceptedTOS !== 'true'){
                            history.pushState({}, "", "/psamaui/tos");
                        } else {
                            if (sessionStorage.redirection_url) {
                                window.location = sessionStorage.redirection_url;
                            }
                            else {
                                // todo: based on user
                                history.pushState({}, "", "/picsureui");
                            }
                        }
                    }.bind(this),
                    error: function(data){
                        notification.showFailureMessage("Failed to authenticate with provider. Try again or contact administrator if error persists.")
                        history.pushState({}, "", sessionStorage.not_authorized_url? sessionStorage.not_authorized_url : "/psamaui/not_authorized?redirection_url=/picsureui");
                    }
                });
            }else{
                if (!settings.client_id){
                    notification.showFailureMessage("Client_ID is not provided. Please update overrides/login.js file.");
                }
                var clientId = settings.client_id;

                // The setting 'customizeAuth0Login' directs the UI to render individual buttons for the oauth login screen
                // if this setting is false, then the standard Auth0 Lock (an email/password entry form) is used.
                // Some institutions require a username instead of an email for login; the Lock workflow would then require
                // the users to enter their credentials twice;  we can avoid that by using buttons only (customize == true)
                if (settings.customizeAuth0Login){
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
                            settings.auth0domain + ".auth0.com",
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
		},
        handleNotAuthorizedResponse : function () {
            console.log("Auth0-handleNotAuthorizedResponse()");

            if (JSON.parse(sessionStorage.session).token) {
                if (sessionStorage.not_authorized_url)
                    window.location = sessionStorage.not_authorized_url;
                else
                    window.location = "/psamaui/not_authorized" + window.location.search;
            }
            else {
                console.log("No token in session, so redirect to logout...");
                return null; //window.location = "/psamaui/logout" + window.location.search;
            }
        },
        displayNotAuthorized : function () {
            console.log("Auth0-displayNotAuthorized()");
            if (overrides.displayNotAuthorized)
                overrides.displayNotAuthorized()
            else {
                sessionStorage.clear();
                localStorage.clear();
                $('#main-content').html(HBS.compile(notAuthorizedTemplate)({helpLink:picsureSettings.helpLink}));
            }
        }
    };
	return settings.idp_provider == "fence" ? fenceLogin : login;
});

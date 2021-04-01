define(['common/session', 'psamaSettings/settings', 'common/searchParser', 'jquery', 'handlebars', 'login/loginButtons', 'text!login/not_authorized.hbs', 'psamaui/overrides/login', 'util/notification', 'psamaui/login/fence_login','text!login/connections.json'],
		function(session, settings, parseQueryString, $, HBS, loginButtons, notAuthorizedTemplate, overrides, notification, fenceLogin, connectionsStr){

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
                if (!overrides.client_id){
                    notification.showFailureMessage("Client_ID is not provided. Please update overrides/login.js file.");
                }
                var clientId = overrides.client_id;

//                require.config({
//                    shim: {
//                        "auth0Lock": {
//                            deps:["jquery"],
//                            exports: "Auth0Lock"
//                        }
//                    }
//                });
                
                if (settings.customizeAuth0Login){
            	   var oauth = {
            		    client_id : clientId,
            		    domain : 'avillachlab.auth0.com',
            		    callbackURL : redirectURI
            	    };
            	    $('#main-content').html("<div id='frmAuth0Login'></div>");
                	loginButtons.showLockButtons(connections, oauth);
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
                $('#main-content').html(HBS.compile(notAuthorizedTemplate)({helpLink:settings.helpLink}));
            }
        }
    };
	return settings.idp_provider == "fence" ? fenceLogin : login;
});

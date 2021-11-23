define(['common/session', 'common/searchParser', 'jquery', 'handlebars', 'login/loginButtons',
        'text!login/not_authorized.hbs', 'psamaui/overrides/login', 'util/notification',
        "picSure/settings", 'common/transportErrors','text!login/connections.json'],
		function(session, parseQueryString, $, HBS, loginButtons,
                 notAuthorizedTemplate, overrides, notification,
                 settings, transportErrors, connectionsStr){

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
                success: session.sessionInit,
                error: handleAuthenticationError
            });
        } else{
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
                $('#main-content').html(HBS.compile(notAuthorizedTemplate)({helpLink:settings.helpLink}));
            }
        }
    }
});

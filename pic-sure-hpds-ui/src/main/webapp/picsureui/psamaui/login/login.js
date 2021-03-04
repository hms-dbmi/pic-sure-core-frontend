define(['common/session', 'psamaSettings/settings', 'common/searchParser', 'jquery', 'handlebars', 'text!login/login.hbs',
        'text!login/not_authorized.hbs', 'psamaui/overrides/login', 'util/notification', 'psamaui/login/fence_login',
        "picSure/settings", 'common/transportErrors'],
		function(session, psamaSettings, parseQueryString, $, HBS, loginTemplate,
                 notAuthorizedTemplate, overrides, notification, fenceLogin,
                 picSureSettings, transportErrors){

	var loginTemplate = HBS.compile(loginTemplate);

	var loginCss = null
	$.get("https://avillachlab.us.webtask.io/connection_details_base64?webtask_no_cache=1&css=true", function(css){
		loginCss = "<style>" + css + "</style";
	});

	var showNormalLogin = function(){
        console.log("Auth0-showLoginPage()");

        var queryObject = parseQueryString();
        if (queryObject.redirection_url) sessionStorage.redirection_url = queryObject.redirection_url.trim();
        if (queryObject.not_authorized_url) sessionStorage.not_authorized_url = queryObject.not_authorized_url.trim();
        var redirectURI = window.location.protocol
            + "//"+ window.location.hostname
            + (window.location.port ? ":"+window.location.port : "")
            + "/psamaui/login/";
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
            if (!overrides.client_id){
                notification.showFailureMessage("Client_ID is not provided. Please update overrides/login.js file.");
            }
            var clientId = overrides.client_id;

            if (psamaSettings.customizeAuth0Login){
                require.config({
                    paths: {
                        'auth0-js': "webjars/auth0.js/9.2.3/build/auth0"
                    },
                    shim: {
                        "auth0-js": {
                            deps:["jquery"],
                            exports: "Auth0Lock"
                        }
                    }
                });
                require(['auth0-js'], function(){
                    $.ajax("https://avillachlab.us.webtask.io/connection_details_base64/?webtask_no_cache=1&client_id=" + clientId,
                        {
                            dataType: "text",
                            success : function(scriptResponse){
                                scriptResponse = scriptResponse.replace("responseType : \"code\"","responseType : \"token\"");
                                $('#main-content').html(loginTemplate({
                                    buttonScript : scriptResponse,
                                    clientId : clientId,
                                    auth0Subdomain : "avillachlab",
                                    callbackURL : redirectURI
                                }));
                                overrides.postRender ? overrides.postRender.apply(this) : undefined;
                                $('#main-content').append(loginCss);
                            }
                        })
                });


            } else {
                require.config({
                    paths: {
                        'auth0Lock': "webjars/auth0-lock/11.2.3/build/lock",
                    },
                    shim: {
                        "auth0Lock": {
                            deps:["jquery"],
                            exports: "Auth0Lock"
                        }
                    }
                });
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
        $.ajax({
            url: window.location.origin + "/psama/user/me/queryTemplate/" + picSureSettings.applicationIdForBaseQuery,
            type: 'GET',
            headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
            contentType: 'application/json',
            success: function(queryTemplateResponse) {
                var currentSession = JSON.parse(sessionStorage.getItem("session"));
                currentSession.queryTemplate = queryTemplateResponse.queryTemplate;
                sessionStorage.setItem("session", JSON.stringify(currentSession));

                if (data.acceptedTOS !== 'true'){
                    history.pushState({}, "", "/psamaui/tos");
                } else {
                    if (sessionStorage.redirection_url) {
                        window.location = sessionStorage.redirection_url;
                    }
                    else {
                        history.pushState({}, "", "/picsureui");
                    }
                }
            }.bind(this),
            error: function(queryTemplateResponse) {
                transportErrors.handleAll(queryTemplateResponse, "Cannot retrieve query template with status: " + queryTemplateResponse.status);
            }
        });
    };

	var handleAuthenticationError = function(data){
        notification.showFailureMessage("Failed to authenticate with provider. Try again or contact administrator if error persists.")
        history.pushState({}, "", sessionStorage.not_authorized_url? sessionStorage.not_authorized_url : "/psamaui/not_authorized?redirection_url=/picsureui");
    };

	return {
	    // make override, remove fence setting
		showLoginPage : psamaSettings.idp_provider == "fence" ? fenceLogin.showLoginPage(handleAuthenticationError) : showNormalLogin,
        handleNotAuthorizedResponse : function () {
            console.log("handleNotAuthorizedResponse()");

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
            console.log("displayNotAuthorized()");
            if (overrides.displayNotAuthorized)
                overrides.displayNotAuthorized()
            else {
                sessionStorage.clear();
                localStorage.clear();
                $('#main-content').html(HBS.compile(notAuthorizedTemplate)({helpLink:psamaSettings.helpLink}));
            }
        }
    }
});

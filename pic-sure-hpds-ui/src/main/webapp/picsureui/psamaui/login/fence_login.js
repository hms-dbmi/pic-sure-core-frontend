define(['psamaSettings/settings', 'jquery', 'handlebars', 'text!login/fence_login.hbs', 'psamaui/overrides/login',
        'common/session', 'picSure/settings', 'common/transportErrors'],
    function(psamaSettings, $, HBS, loginTemplate, loginOverrides,
             session, picSureSettings, transportErrors){
        var loginTemplate = HBS.compile(loginTemplate);

        var sessionInit = function(data) {
            session.authenticated(data.userId, data.token, data.email, data.permissions, data.acceptedTOS, this.handleNotAuthorizedResponse);
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
                    currentSession.queryScopes = meResponse[0].queryScopes;
                    sessionStorage.setItem("session", JSON.stringify(currentSession));

                    if (data.acceptedTOS !== 'true'){
                        history.pushState({}, "", "/psamaui/tos");
                    } else {
                        if (sessionStorage.redirection_url && sessionStorage.redirection_url !== 'undefined') {
                            window.location = sessionStorage.redirection_url;
                        }
                        else {
                            window.location = "/picsureui/dataAccess";
                        }
                    }
                }.bind(this),
                function(queryTemplateResponse, meResponse) {
                    if (queryTemplateResponse[0].status !== 200)
                        transportErrors.handleAll(queryTemplateResponse[0], "Cannot retrieve query template with status: " + queryTemplateResponse[0].status);
                    else
                        transportErrors.handleAll(meResponse[0], "Cannot retrieve user with status: " + meResponse[0].status);
                }
            )
        };

        return {
            showLoginPage : function(handleAuthenticationErrorCallback){
                return function () {
                    // Check if the `code` parameter is set in the URL, as it would be, when
                    // FENCE redirects back after authentication.
                    var queryString = window.location.search.substring(1);
                    var params = {}, queries, temp, i, l;
                    // Split into key/value pairs
                    queries = queryString.split("&");
                    // Convert the array of strings into an object
                    for ( i = 0, l = queries.length; i < l; i++ ) {
                        temp = queries[i].split('=');
                        params[temp[0]] = temp[1];
                    }
                    var code = params['code'];
                    if (code) {
                        if (loginOverrides.waitingMessage) {
                            $('#main-content').html(loginOverrides.waitingMessage);
                        }

                        $.ajax({
                            url: '/psama/authentication',
                            type: 'post',
                            data: JSON.stringify({
                                code: code
                            }),
                            contentType: 'application/json',
                            success: sessionInit,
                            error: handleAuthenticationErrorCallback
                        });
                    } else {
                        console.log("FENCE-showLoginPage() no code in query string, redirecting to FENCE");

                        // Show the fence_login template, with the generated fenceLoginURL
                        $('#main-content').html(loginTemplate({
                            fenceURL : psamaSettings.idp_provider_uri + "/user/oauth2/authorize"+
                                "?response_type=code"+
                                "&scope=user+openid"+
                                "&client_id=" + psamaSettings.fence_client_id +
                                "&redirect_uri=" + window.location.protocol
                                + "//"+ window.location.hostname
                                + (window.location.port ? ":"+window.location.port : "")
                                + "/psamaui/login/"
                        }));
                    }
                }
            }
        }
    });

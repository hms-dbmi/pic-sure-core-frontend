define(["jquery", "studyAccess/studyAccess", "common/session"],
    function($, studyAccess, session) {
        var transportErrorHandlers = {
            session: session
        };

        transportErrorHandlers.redirectionUrl = "/psamaui/login?redirection_url=/picsureui/";

        transportErrorHandlers.handleAll = function (response, message) {
            var hasError = false;
            if (this.handle401(response)) {
                console.debug("Captured HTTP 401 response");
                hasError = true;
            }
            console.log(message);
            if(!message || message==='error'){
                history.pushState({}, "Unexpected Error", "/picsureui/unexpected_error");
            }
            return hasError;
        }.bind(transportErrorHandlers);


        transportErrorHandlers.handle401 = function (response, redirectionUrl = false) {
            if (redirectionUrl === false) redirectionUrl = this.redirectionUrl;
            if (response.status === 401) {
                if (this.session.isValid()) {
                    history.pushState({}, "Not Authorized", "/psamaui/not_authorized");
                } else {
                    history.pushState({}, "Login", "/psamaui/logout");
                }
            }
            return false;
        }.bind(transportErrorHandlers);

        return transportErrorHandlers;
    }
);

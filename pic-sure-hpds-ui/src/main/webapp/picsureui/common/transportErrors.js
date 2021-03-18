define(["jquery", "studyAccess/studyAccess", "common/session"],
    function($, studyAccess, session) {
        var transportErrorHandlers = {
            session: session
        };

        transportErrorHandlers.redirectionUrl = "/psamaui/login?redirection_url=/picsureui/";

        transportErrorHandlers.handleAll = function (response) {
            var hasError = false;
            if (this.handle401(response)) {
                console.debug("Captured HTTP 401 response");
                hasError = true;
            }
            return hasError;
        }.bind(transportErrorHandlers);


        transportErrorHandlers.handle401 = function (response, redirectionUrl = false) {
            if (redirectionUrl === false) redirectionUrl = this.redirectionUrl;
            if (response.status === 401) {
                if (this.session.isValid()) {
                    sessionStorage.clear();
                    history.pushState({}, "Login", redirectionUrl);
                } else {
                    history.pushState({}, "Not Authorized", "/psamaui/not_authorized");
                }
            }
            return false;
        }.bind(transportErrorHandlers);

        return transportErrorHandlers;
    }
);

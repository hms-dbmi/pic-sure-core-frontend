define(["jquery"],
    function($) {
        var transportErrorHandlers = {};
        transportErrorHandlers.redirectionUrl = "/psamaui/login?redirection_url=" + "/picsureui/";

        transportErrorHandlers.handleAll = function (response) {
            var hasError = false;
            if (!hasError && this.handle401(response)) {
                console.debug("Captured HTTP 401 response");
                hasError = true;
            }
            return hasError;
        }.bind(transportErrorHandlers);


        transportErrorHandlers.handle401 = function (response, redirectionUrl = false) {
            if (redirectionUrl === false) redirectionUrl = this.redirectionUrl;
            if (response.status === 401) {
                sessionStorage.clear();
                window.location = redirectionUrl;
                return true;
            }
            return false;
        }.bind(transportErrorHandlers);

        return transportErrorHandlers;
    }
);

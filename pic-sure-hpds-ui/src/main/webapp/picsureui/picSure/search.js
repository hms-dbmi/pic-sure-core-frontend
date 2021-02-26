define([], function(){
    return {
        dictionary: function(query, success, error, resourceUUID) {
            return $.ajax({
                url: window.location.origin + '/picsure/search/' + resourceUUID,
                data: JSON.stringify({
                    "query": query
                }),
                headers: {
                    "Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token
                },
                contentType: 'application/json',
                type: 'POST',
                success: success,
                error: error,
                dataType: "json"
            });
        }
    };
});
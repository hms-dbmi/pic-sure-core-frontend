define(["jquery", 'underscore'], 
		function($,  _){

    var runningQueryIds = {};

    var submitQuery = function(targetSystem, query, displayName, dataCallback){
        sessionStorage.setItem("lastActivityTime", new Date().getTime());
        var checkStatus = function(id, stillRunning){
            setTimeout(function(){
                $.ajax(targetSystem.queryPath + '/' + runningQueryIds[displayName] + '/status', {
                    type:'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({resourceCredentials:{IRCT_BEARER_TOKEN:localStorage.getItem("id_token"),BEARER_TOKEN:localStorage.getItem("id_token")}}),
                    success: function(data){
                        switch(data.resourceStatus){
                            case "RUNNING":
                                // Query is still running so just keep waiting.
                                stillRunning();
                                break;
                            case "PENDING":
                                // Query is still running so just keep waiting.
                                stillRunning();
                                break;
                            case "CREATED":
                                // Query just started running so just keep waiting.
                                stillRunning();
                                break;
                            case "AVAILABLE":
                                // Query has completed
                                var i2b2ResultId = data.resourceResultId;
                                $.ajax({
                                    url : targetSystem.queryPath + '/' + runningQueryIds[displayName] + '/result',
                                    data: JSON.stringify({resourceCredentials:{IRCT_BEARER_TOKEN:localStorage.getItem("id_token"),BEARER_TOKEN:localStorage.getItem("id_token")}}),
                                    type: 'POST',
                                    contentType: 'application/json',
                                    headers: {"Authorization": "Bearer " + localStorage.getItem("id_token")},
                                    success : function(result){
                                        result.i2b2ResultId = i2b2ResultId;
                                        dataCallback(result);
                                    },
                                    failure : function(data){
                                        console.log(data);
                                    }
                                });
                                break;
                            case "ERROR":
                                // Query failed
                                dataCallback(data);
                                break;
                            default :
                                console.log("UNKNOWN QUERY STATUS : " + data.resourceStatus);
                                dataCallback(undefined);
                                break;
                        };
                    },
                    headers: {"Authorization": "Bearer " + localStorage.getItem("id_token")}
                });
            }, 500);
        }

        var initiateQuery = function(){
            $.ajax(targetSystem.queryPath, {
                data : JSON.stringify({query:query, resourceUUID:targetSystem.uuid, resourceCredentials:{IRCT_BEARER_TOKEN:localStorage.getItem("id_token"),BEARER_TOKEN:localStorage.getItem("id_token")}}),
                headers: {"Authorization": "Bearer " + localStorage.getItem("id_token")},
                contentType: 'application/json',
                type: 'POST',
                success: function(data, status, jqXHR){
                    runningQueryIds[displayName] = data.picsureResultId;
                    var stillRunning = function(){
                        checkStatus(runningQueryIds[displayName], stillRunning);
                    };
                    stillRunning();
                },
                error: function(data, status, jqXHR){
                    dataCallback(data);
                }
            });
        }

        initiateQuery();
    };

    return {
        submitQuery : submitQuery
    }
});

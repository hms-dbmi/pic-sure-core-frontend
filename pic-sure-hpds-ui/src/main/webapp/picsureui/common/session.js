define(["jquery", "underscore", "overrides/session", "common/styles"], function($, _, sessionOverrides){
	var storedSession = JSON.parse(
			sessionStorage.getItem("session"));
	
	var session = storedSession ? storedSession : {
		username : null,
		permissions : [],
		privileges : [],
		email : null
	};

	var expired = function() {
		return new Date().getTime()/1000 > JSON.parse(atob(JSON.parse(sessionStorage.session).token.split('.')[1])).exp;
	}

	var handleNotAuthorizedResponse = function() {
		try {
			if (expired()) {
				history.pushState({}, "", "/psamaui/logout");
			} else {
				history.pushState({}, "", "/psamaui/not_authorized");
			}
		} catch (e) {
			console.log("Error determining token expiry");
			history.pushState({}, "", "/psamaui/not_authorized");
		}
	};
	
	var configureAjax = function(){
		$.ajaxSetup({
			headers: {"Authorization": "Bearer " + session.token},
			statusCode: {
				401: function(){
                    sessionOverrides.handleNotAuthorizedResponse ? sessionOverrides.handleNotAuthorizedResponse() : handleNotAuthorizedResponse();
				},
				403: function(){
                    history.pushState({}, "", "/psamaui/not_authorized");
				}
			}
		});
	};
	
	return {
		username : session.username,
		may : function(permission){
			return _.contains(permission, session.permissions);
		},
		authenticated : function(userId, token, username, permissions, acceptedTOS) {
			session.userId = userId;
			session.token = token;
			session.username = username;
			session.permissions = permissions;
			session.acceptedTOS = acceptedTOS;
			sessionStorage.setItem("session", JSON.stringify(session));
			configureAjax();
		},
		isValid : function(){
			if(session.username){
				var isExpired = expired();
				if (!isExpired) {
					configureAjax();
				}
				return !isExpired;
			}else{
				return false;
			}
		},
		token: function(){
			return JSON.parse(sessionStorage.session).token;
		},
		setToken: function(token){
            session.token = token;
            sessionStorage.setItem("session", JSON.stringify(session));
		},
		username : function(){
			return JSON.parse(sessionStorage.session).username;
		},
        email : function(){
            return JSON.parse(sessionStorage.session).email;
        },
		userId : function(){
			return JSON.parse(sessionStorage.session).userId;
		},
		// userMode : function(){
		// 	return JSON.parse(sessionStorage.session).currentUserMode;
		// },
		acceptedTOS : function(){
			return JSON.parse(sessionStorage.session).acceptedTOS;
		},
		privileges: function(){
			return JSON.parse(sessionStorage.session).privileges;
		},
		activity : _.throttle(function(activity){
			if(typeof activity !== "string"){
				activity = window.location.href;
			}
            /**
			 * /interaction end-point cannot be found. Do we still need to call it?
			 */
			// $.ajax({
			// 	data: JSON.stringify({
			// 		description : activity
			// 	}),
			// 	url: "/rest/interaction",
			// 	type: 'POST',
			// 	dataType: "json",
			// 	contentType: "application/json"
			// });
		}, 10000),
		setAcceptedTOS : function() {
			session.acceptedTOS = true;
            sessionStorage.setItem("session", JSON.stringify(session));
		}
	}
});
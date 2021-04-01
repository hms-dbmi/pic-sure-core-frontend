define(['jquery', 'auth0-lock'], 
function($, Auth0Lock) {
	return{
		showLockButtons: function(connections, oauth){
		    var lock = new Auth0Lock(oauth.client_id, oauth.domain);
		    lock.on('signin ready', function() {
		        $('.a0-iconlist').html('<div style="font-size: 140%">Please click one of the buttons below to log in.</div><br />');
		        if (connections == null || connections.length == 0) {
		            $('<div>There was no data returned. This is a temporary issue.</div>' + '<form><input type="submit" value="Please Retry" /></form>').appendTo('.a0-iconlist');
		        } else {
		            $.each(connections, function(connectionIdx, connectionDetails) {
		                if (connectionDetails == null) {
		                    console.log("Connection #" + connectionIdx + " is nul");
		                    return true;
		                }
		                if (connectionDetails.logo == null) {
		                    var link = $('<a class="a0-zocial a0-' + (connectionDetails.name == 'google-oauth2' ? 'googleplus' : connectionDetails.name) + '" href="#">' + '<span style="text-transform: none">' + connectionDetails.text + '</span></a>');
		                } else {
		                    var logoimg = (connectionDetails.logo != null ? connectionDetails.logo : 'unknown.jpg');
		                    var link = $('<a class="a0-zocial a0-' + connectionDetails.name + '" href="#" style="background-color: ' + connectionDetails.background_color + '">' + '<img src="' + logoimg + '" style="background-color: ' + connectionDetails.background_color + '; ' + 'padding-top: 4px; padding-bottom: 3px; padding-left: 5px; padding-right: 5px; vertical-align: middle"/>' + '<span style="text-transform: none">' + connectionDetails.text + '</span></a>');
		                }
		                link.appendTo('.a0-iconlist');
		                link.on('click', function() {
		                    lock.getClient().login({
		                        connection: connectionDetails.name
		                    });
		                });
		            });
		        }
		    });
		    lock.show({
		        "container": "frmAuth0Login",
		        "dict": {
		            signin: {
		                title: "Login with one of these providers:",
		                footerText: 'Please click one of the buttons above and you will be redirected to your provider\'s website.'
		            }
		        },
		        rememberLastLogin: false,
		        sso: false,
		        callbackURL: oauth.callbackURL,
		        responseType: "token",
		        disableSignupAction: true,
		        disableResetAction: true,
		        socialBigButtons: false,
		        connection: [''],
		        "authParams": {
		            "scope": "openid profile"
		        }
		    });
		    $('.a0-image').css('display', 'none');
		    $('#a0-lock.a0-theme-default .a0-panel .a0-icon-container').css('padding-top', '2px');
		    $('#a0-lock.a0-theme-default .a0-panel .a0-bg-gradient').css('height', '70%');
		    $('#a0-lock.a0-theme-default .a0-panel .a0-mode form .a0-body-content').css('padding-top', '0px');
		    $('#a0-lock.a0-theme-default .a0-panel .a0-top-header').css('display', 'none');
		}
	};
});

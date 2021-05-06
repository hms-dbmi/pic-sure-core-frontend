define(['jquery', 'auth0-js', 'handlebars', 'text!login/loginButtons.hbs'], 
function($, auth0, HBS, buttonsTemplate) {
	return{
		showLockButtons: function (connections, oauthOptions){
			/*
			 * To add additional Auth0 connections, add the desired information to the connections.json file
			 * in the project-specific repository in the path /picsureui/psamaui/login/.
			 * A default connection (Google) is included in the base repo to provide an example structure.
			 */
			$('#frmAuth0Login').html(HBS.compile(buttonsTemplate)({connections: connections}));
			
			
			_.each(connections, function(item){
				
				$(".a0-" + item.name).click(function(){
			        const webAuth = new auth0.WebAuth(oauthOptions);
					
			        webAuth.authorize({
			          responseType: 'token',
			          connection: item.name
			        });
			      });
			});
		}
	};
});

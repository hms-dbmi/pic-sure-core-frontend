define(['jquery', 'auth0-js', 'handlebars', 'text!login/loginButtons.hbs', 'psamaSettings/settings'], 
function($, auth0, HBS, buttonsTemplate, settings) {
	return{
		showLockButtons: function (connections, oauth){
			/*
			 * To add additional Auth0 connections, add the desired information to the connections.json file
			 * in the project-specific repository in the path /picsureui/psamaui/login/.
			 * A default connection (Google) is included in the base repo to provide an example structure.
			 */
			$('#frmAuth0Login').html(HBS.compile(buttonsTemplate)({connections: connections}));
			
			const options = {
			        domain: oauth.domain,
			        clientID: oauth.client_id,
			        redirectUri: settings.redirect_link,
			        responseType: 'token'
			      };
			
			_.each(connections, function(item){
				
				$(".a0-" + item.name).click(function(){
			        const webAuth = new auth0.WebAuth(options);
					
			        webAuth.authorize({
			          responseType: 'token',
			          connection: item.name
			        });
			      });
			});
		}
	};
});

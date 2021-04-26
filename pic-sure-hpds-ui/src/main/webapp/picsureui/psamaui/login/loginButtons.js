define(['jquery', 'auth0-js', 'handlebars', 'text!login/loginButtons.hbs', 'psamaSettings/settings'], 
function($, auth0, HBS, buttonsTemplate, settings) {
	return{
		showLockButtons: function (connections, oauth){
			
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
		} ,
			
		oldShowButtons: function(connections, oauth){
			
		    $('.a0-image').css('display', 'none');
		    $('#a0-lock.a0-theme-default .a0-panel .a0-icon-container').css('padding-top', '2px');
		    $('#a0-lock.a0-theme-default .a0-panel .a0-bg-gradient').css('height', '70%');
		    $('#a0-lock.a0-theme-default .a0-panel .a0-mode form .a0-body-content').css('padding-top', '0px');
		    $('#a0-lock.a0-theme-default .a0-panel .a0-top-header').css('display', 'none');
		}
	};
});

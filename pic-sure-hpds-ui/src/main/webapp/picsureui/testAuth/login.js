define(['jquery'], function($){
	return { 
		showLoginPage : function(){
			$.ajaxSetup({
				headers: {"Authorization": "Bearer " + localStorage.id_token}
			});
			
		}
	}
});


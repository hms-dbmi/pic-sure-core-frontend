define(["backbone", "handlebars", "user/connections", "picSure/userFunctions", "picSure/picsureFunctions", "text!user/addUser.hbs", "text!user/addUserConnectionForm.hbs", "util/notification"],
		function(BB, HBS, connections, userFunctions, picsureFunctions, template, connectionTemplate, notification){
	var view = BB.View.extend({
		initialize: function(opts){
			this.connectionTemplate = HBS.compile(connectionTemplate);
			this.template = HBS.compile(template);
			this.managementConsole = opts.managementConsole;
        },
		events: {
			"change #new-user-connection-dropdown":"renderConnectionForm",
			"input #email": "validateEmail"
		},
		validateEmail: function(event){
	        var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
	        if(!emailReg.test($('input[name=email]').val())) {
	        	$('#error-email').html('Enter a valid email address.');
	        	$("#error-email").show();
	        	$("#save-user-button").prop( "disabled", true);
        	} else {
        		//only check the current connection's users; unique per connection
    			var emails = _.pluck(this.connection.users, "email")
    			if(emails.includes($("#email").val())){
    				$('#error-email').html('That email address is already in use.');
    				$("#error-email").show();
    				$("#save-user-button").prop( "disabled", true);
    			} else {
    				//happy path - valid and unique
    				$("#error-email").hide();
    				$("#save-user-button").prop( "disabled", false);
    			}
        	}
		},
		renderConnectionForm: function(event){
            this.connection = _.find(this.connections, {id:event.target.value});
			userFunctions.getAvailableRoles(function (roles) {
				$('#current-connection-form', this.$el).html(
						this.connectionTemplate({
								connection: this.connection,
								createOrUpdateUser: true, 
								availableRoles: roles
						}));
            }.bind(this));
		},
        getConnections : function(callback){
            picsureFunctions.getConnection("", false, callback);
        },
		render: function(){
			// load available connections first
            this.getConnections(function (connections) {
                this.connections = connections;
                this.$el.html(this.template({connections: this.connections}));
                this.renderConnectionForm({target:{value:this.connections[0].id}})
            }.bind(this));
		}
	});
	return view;
});
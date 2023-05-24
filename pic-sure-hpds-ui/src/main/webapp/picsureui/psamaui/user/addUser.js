define(["backbone", "underscore", "handlebars", "user/connections", "picSure/userFunctions", "picSure/picsureFunctions", "text!user/addUser.hbs", "text!user/addUserConnectionForm.hbs", "util/notification"],
		function(BB, _, HBS, connections, userFunctions, picsureFunctions, template, connectionTemplate, notification){
	let view = BB.View.extend({
		initialize: function(opts) {
			this.connectionTemplate = HBS.compile(connectionTemplate);
			this.template = HBS.compile(template);
			this.managementConsole = opts.managementConsole;
			this.model = opts.model;
        },
		events: {
			"change #new-user-connection-dropdown":"renderConnectionForm",
			"input #email": "validateEmail",
			"click #save-user-button":   "saveUserAction",
			"click #cancel-user-button": "closeDialog",
			"click input[name*='Admin']": "checkUserRoleOnAdminRoleChecked",
			"click input[name='PIC-SURE User']": "uncheckAdminRoleOnUnchecked"
		},
		validateEmail: function(event){
	        let emailReg = /(?:[a-zA-Z0-9!#$%&'*+/=?^_{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
	        if(!emailReg.test($('input[name=email]').val())) {
	        	$('#error-email').html('Enter a valid email address.');
	        	$("#error-email").show();
	        	$("#save-user-button").prop( "disabled", true);
        	} else {
        		//only check the current connection's users; unique per connection
    			let emails = _.pluck(this.connection.users, "email");
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
		saveUserAction: function (e) {
			e.preventDefault();
			let user = {};
			if (this.model.get("selectedUser") != null && this.model.get("selectedUser").uuid.trim().length > 0) {
				user = this.model.get("selectedUser");
			}
			//general_metadata is used in both new and existing user flow
			let general_metadata = {};

			user.connection = {
				id: this.$('input[name=connectionId]').val()
			};

			// use the connection field to determine if this is a new or existing user.
			if(user.connection.id){
				//existing - read meta fields from inputs
				user.auth0metadata = this.$('input[name=auth0metadata]').val();
				user.subject = this.$('input[name=subject]').val();
				//this includes the user uuid
				_.each($('#required-fields input[type=text]'), function(entry){
					general_metadata[entry.name] = entry.value;
				});
				user.email = general_metadata.email ? general_metadata.email : email; // synchronize email with metadata
			} else {
				//new user - we have a different connection and email input to read, and no auth0 data
				user.connection = {
					id: $('#new-user-connection-dropdown').val()
				};
				//this will typically be only email input
				_.each($('#current-connection-form input[type=text]'), function(entry){
					general_metadata[entry.name] = entry.value;
				});
			}
			user.generalMetadata = JSON.stringify(general_metadata);
			
			let roles = [];
			_.each(this.$('input:checked'), function (checkbox) {
				roles.push({uuid: checkbox.value});
			});
			user.roles = roles;
			userFunctions.createOrUpdateUser([user], user.uuid == null ? 'POST' : 'PUT', function(result) {
				console.log(result);
				this.render();
				this.closeDialog();
			}.bind(this));
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
		closeDialog: function () {
			// cleanup
			this.model.unset("selectedUser");
			$(".close").click();
		},
		checkUserRoleOnAdminRoleChecked: function (event) {
			console.debug("checkUserRoleOnAdminRoleChecked");
			let userRoleCheckbox = $('input[name="PIC-SURE User"]');

			let isAdminChecked = event.target.checked;
			if (isAdminChecked) {
				userRoleCheckbox.prop('checked', isAdminChecked);
			}
		},
		uncheckAdminRoleOnUnchecked: function (event) {
			console.debug("uncheckAdminRoleOnUnchecked");
			let adminRoleCheckbox = $('input[name*="Admin"]');
			let isUserRoleChecked = event.target.checked;

			// If the user role has been unchecked we must uncheck the admin roles
			if (!isUserRoleChecked) {
				adminRoleCheckbox.prop('checked', isUserRoleChecked);
			}
		},
		render: function() {
			// load available connections first
            this.getConnections(function (connections) {
                this.connections = connections;
                this.$el.html(this.template({connections: this.connections}));
                this.renderConnectionForm({target:{value:this.connections[0].id}});
            }.bind(this));
		}
	});
	return view;
});
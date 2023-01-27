define([
    'backbone',
    'handlebars',
    'text!user/userDetails.hbs',
    'util/notification',
    'picSure/userFunctions',
], function(BB, HBS, userTemplate, notification, userFunctions) {
    let userDetailsView = BB.View.extend({
        initialize: function(opts){
			this.model = opts.model || new BB.Model();
			this.user = this.model.get("selectedUser") || {};
			this.availableRoles = this.model.get("availableRoles") || [];
			this.createOrUpdateUser = opts.createOrUpdateUser || false;
            this.requiredFields = opts.requiredFields;
            this.template = HBS.compile(userTemplate);
        },
        events: {
            "click #switch-status-button": "deactivateUser",
			"click #edit-user-button":     "editUser",
            "click .close":                "closeDialog",
            "click #cancel-user-button":   "closeDialog",
            "click #switch-status-button": "deactivateUser",
            "click .btn-show-inactive":    "toggleInactive",
			"click #save-user-button":   "saveUserAction",
        },
        applyCheckboxes: function () {
			var checkBoxes = $(":checkbox", this.$el);
			var userRoles = this.model.get("selectedUser").roles;
			_.each(checkBoxes, function (roleCheckbox) {
				_.each(userRoles, function (userRole) {
					if (userRole.uuid == roleCheckbox.value) {
						roleCheckbox.checked = true;
					}
				})
			})
		},
		editUser: function (events) {
            this.createOrUpdateUser = true;
            this.render();
		},
        deactivateUser: function (event) {
			try {
				var user = this.model.get('selectedUser');
				user.active = !user.active;
				if (!user.subject) {
					user.subject = null;
				}
				if (!user.roles) {
					user.roles = [];
				}
				user.generalMetadata = JSON.stringify(user.generalMetadata);
				notification.showConfirmationDialog(function () {
					userFunctions.createOrUpdateUser([user], 'PUT', function (response) {
						this.render()
					}.bind(this));
				}.bind(this));
			} catch (err) {
				console.error(err.message);
				notification.showFailureMessage('Failed to deactivate user. Contact administrator.')
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
					general_metadata[entry.name] = entry.value
				});
				user.email = general_metadata["email"] ? general_metadata["email"] : email; // synchronize email with metadata
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
			})
			user.roles = roles;
			userFunctions.createOrUpdateUser([user], user.uuid == null ? 'POST' : 'PUT', function(result) {
				console.log(result);
				this.render();
			}.bind(this));
		},
        toggleInactive: function (event) {
			var id = event.target.id
			$('#inactive-' + id, this.$el).toggle();
			var toggleButton = $('.btn-show-inactive#' + id + ' span', this.$el);
			if (toggleButton.hasClass('glyphicon-chevron-down'))
				toggleButton.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
			else
				toggleButton.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
		},
		closeDialog: function () {
			this.model.unset("selectedUser");
			$(".close").click();
		},
        render: function(){
            this.$el.html(this.template(this));
			if (this.createOrUpdateUser) {
				$("input[name=email]").attr('disabled', true);
                this.applyCheckboxes();
            }
        }
    });
    return userDetailsView;
});

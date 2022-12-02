define([
    'backbone',
    'handlebars',
    'text!user/userDetails.hbs',
    'util/notification',
    'picSure/userFunctions',
], function(BB, HBS, userTemplate, notification, userFunctions) {
    let userDetailsView = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(userTemplate);
            this.opts = opts;
            this.model = opts.model;
            if (opts.createOrUpdateUser) {
                $("input[name=email]").attr('disabled', true);
                this.applyCheckboxes();
            }
        },
        events: {
            "click #switch-status-button": "deactivateUser",
            "click .close":                "closeDialog",
            "click #cancel-user-button":   "closeDialog",
            "click #switch-status-button": "deactivateUser",
            "click .btn-show-inactive":    "toggleInactive"
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
        toggleInactive: function (event) {
			var id = event.target.id
			$('#inactive-' + id, this.$el).toggle();
			var toggleButton = $('.btn-show-inactive#' + id + ' span', this.$el);
			if (toggleButton.hasClass('glyphicon-chevron-down'))
				toggleButton.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
			else
				toggleButton.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
		},
        render: function(){
            this.$el.html(this.template(this.opts));
        }
    });
    return userDetailsView;
});

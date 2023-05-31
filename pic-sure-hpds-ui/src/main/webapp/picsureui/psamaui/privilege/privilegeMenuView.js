define([
    'backbone',
    'handlebars',
    'underscore',
    'text!privilege/privilegeMenu.hbs',
    'picSure/privilegeFunctions',
    'util/notification',
    'picSure/applicationFunctions',
    'common/modal'
], function(BB, HBS, _, template, privilegeFunctions, notification, applicationFunctions, modal) {
    let privilegeMenuView = BB.View.extend({
        initialize: function(opts){
            this.model = opts.model;
            this.privilege = opts.privilege;
            this.createOrUpdatePrivilege = opts.createOrUpdatePrivilege;
            this.applications = opts.applications;
            this.privilegeManagementRef = opts.privilegeManagementRef;
            this.template = HBS.compile(template);
        },
        events: {
            "change #application-dropdown":"dropdownChange",
            "click #delete-privilege-button":"deletePrivilege",
            "click #edit-privilege-button":  "editPrivilegeMenu",
            "click #cancel-privilege-button":"closeDialog",
            "click .close":             "closeDialog",
            "submit":                   "savePrivilegeAction"
        },
        applyOptions: function (privilege) {
			let options = $("#application-dropdown");
			let anyOptionSelected = false;
			_.each(options[0].options, function(option) {
                if (option.value === privilege.application ? privilege.application.uuid : false) {
                    option.selected = true;
                    anyOptionSelected = true;
                } else {
                    option.selected = false;
                }
			});
			if (!anyOptionSelected) {
				options[0].options[0].selected = true;
			}
		},
        editPrivilegeMenu: function (events) {
            this.createOrUpdatePrivilege = true;
            this.render();
		},
        savePrivilegeAction: function (e) {
            e.preventDefault();
            let uuid = this.$('input[name=privilege_name]').attr('uuid');
            let name = this.$('input[name=privilege_name]').val();
            let description = this.$('input[name=privilege_description]').val();

            let applicationUUID = $('.application-block #uuid')[0].innerHTML;

            let privilege;
            let requestType;
            if (this.privilege != null && this.privilege.uuid.trim().length > 0) {
                requestType = "PUT";
            }
            else {
                requestType = "POST";
            }

            privilege = [{
                uuid: uuid,
                name: name,
                description: description,
				application:{
                	uuid: applicationUUID
				}
            }];

            privilegeFunctions.createOrUpdatePrivilege(privilege, requestType, function(result) {
                console.debug(result);
                this.close();
                this.privilegeManagementRef.render();
            }.bind(this));
        },
		deletePrivilege: function (event) {
			let uuid = this.$('input[name=privilege_name]').attr('uuid');
			notification.showConfirmationDialog(function () {

				privilegeFunctions.deletePrivilege(uuid, function (response) {
                    this.close();
                    this.privilegeManagementRef.render();
				}.bind(this));

			}.bind(this));
		},
        close: function(){
            $('.close').click();
        },
        render: function(){
            this.$el.html(this.template(this));
            this.applyOptions(this.privilege);
        }
    });
    return privilegeMenuView;
});
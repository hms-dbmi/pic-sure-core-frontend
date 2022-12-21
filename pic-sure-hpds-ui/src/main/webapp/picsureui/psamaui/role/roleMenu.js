define([
    'backbone',
    'handlebars',
    'text!privilege/privilegeMenu.hbs',
    'picSure/privilegeFunctions',
    'util/notification',
    'picSure/applicationFunctions',
    'common/modal'
], function(BB, HBS, template, privilegeFunctions, notification, applicationFunctions, modal) {
    let privilegeMenuView = BB.View.extend({
        initialize: function(opts){
            this.model = opts.model;
            this.role = opts.role;
            this.privileges = opts.privileges;
            this.createOrUpdatePrivilege = opts.createOrUpdatePrivilege;
            this.applications = opts.applications;
            this.privilegeManagementRef = opts.privilegeManagementRef;
            this.template = HBS.compile(template);
        },
        events: {
            "change #application-dropdown":"dropdownChange",
            "click #delete-privilege-button":"deletePrivilege",
            "click #edit-role-button":  "editRoleMenu",
            "click #edit-privilege-button":  "editPrivilegeMenu",
            "click .close":              "closeDialog",
			"click #cancel-role-button": "closeDialog",
            "submit":                   "saveRoleAction"
        },
        applyCheckboxes: function (role) {
            let checkBoxes = $(":checkbox", this.$el);
            let rolePrivileges = role.privileges;
            _.each(checkBoxes, function (privilegeCheckbox) {
                _.each(rolePrivileges, function(privilege){
                    if (privilege.name === privilegeCheckbox.name){
                        privilegeCheckbox.checked = true;
                    }
                });
            })
        },
        editPrivilegeMenu: function (events) {
            this.createOrUpdatePrivilege = true;
            this.render();
		},
        saveRoleAction: function (e) {
            e.preventDefault();
            var uuid = this.$('input[name=role_name]').attr('uuid');
            var name = this.$('input[name=role_name]').val();
            var description = this.$('input[name=role_description]').val();

            var privileges = [];
            _.each(this.$('input:checked'), function(element) {
            	privileges.push({uuid: element.value});
			});


            var role;
            var requestType;
            if (this.model.get("selectedRole") != null && this.model.get("selectedRole").uuid.trim().length > 0) {
                requestType = "PUT";
            }
            else {
                requestType = "POST";
            }

            role = [{
                uuid: uuid,
                name: name,
                description: description,
				privileges: privileges
            }];

            roleFunctions.createOrUpdateRole(role, requestType, function(result) {
                console.log(result);
                this.render();
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
            this.applyOptions(this.role);
        }
    });
    return privilegeMenuView;
});
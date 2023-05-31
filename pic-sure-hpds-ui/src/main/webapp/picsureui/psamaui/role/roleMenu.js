define([
    'backbone',
    'handlebars',
    'underscore',
    'text!role/roleMenu.hbs',
    'picSure/roleFunctions',
    'util/notification',
    'picSure/applicationFunctions',
    'common/modal'
], function(BB, HBS, _, template, roleFunctions, notification, applicationFunctions, modal) {
    let privilegeMenuView = BB.View.extend({
        initialize: function(opts){
            this.model = opts.model;
            this.role = opts.role;
            this.privileges = opts.privileges;
            this.createOrUpdateRole = opts.createOrUpdateRole;
            this.applications = opts.applications;
            this.roleManagementRef = opts.managementConsole;
            this.template = HBS.compile(template);
        },
        events: {
            "change #application-dropdown":"dropdownChange",
            "click #delete-role-button":"deleteRole",
            "click #edit-role-button":  "editRoleMenu", 
            "click .close":              "close",
			"click #cancel-role-button": "close",
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
        editRoleMenu: function (events) {
            this.createOrUpdateRole = true;
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
                this.close();
                this.roleManagementRef.render();
            }.bind(this));
        },
		deleteRole: function (event) {
			let uuid = this.$('input[name=role_uuid]').attr('uuid');
			notification.showConfirmationDialog(function () {

				roleFunctions.deleteRole(uuid, function (response) {
                    this.close();
                    this.roleManagementRef.render();
				}.bind(this));

			}.bind(this));
		},
        close: function(){
            $('.close').click();
        },
        render: function(){
            this.$el.html(this.template(this));
            this.applyCheckboxes(this.role);
        }
    });
    return privilegeMenuView;
});
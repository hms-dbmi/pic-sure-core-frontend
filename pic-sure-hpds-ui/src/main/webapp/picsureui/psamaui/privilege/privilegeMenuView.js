define([
    'backbone',
    'handlebars',
    'text!privilege/privilegeMenu.hbs',
    'picSure/privilegeFunctions',
    'util/notification',
    'picSure/applicationFunctions'
], function(BB, HBS, template, privilegeFunctions, notification, applicationFunctions) {
    let privilegeMenuView = BB.View.extend({
        initialize: function(opts){
            this.model = opts.model;
            this.privilege = opts.privilege;
            this.createOrUpdatePrivilege = opts.createOrUpdatePrivilege;
            this.applications = opts.applications;
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
			applicationFunctions.fetchApplications(this, function(applications){
				modal.displayModal(new privilegeMenuView({
					createOrUpdatePrivilege: true,
                    privilege: this.privilege,
					applications: applications
				}), "Edit Privilege", () => {this.render(); $('edit-privilege-button').focus();}, {handleTabs: true});
                // this.applyOptions(this.model.get("selectedPrivilege"));
            }.bind(this));
		},
        savePrivilegeAction: function (e) {
            e.preventDefault();
            let uuid = this.$('input[name=privilege_name]').attr('uuid');
            let name = this.$('input[name=privilege_name]').val();
            let description = this.$('input[name=privilege_description]').val();

            let applicationUUID = $('.application-block #uuid')[0].innerHTML;

            let privilege;
            let requestType;
            if (this.model.get("selectedPrivilege") != null && this.model.get("selectedPrivilege").uuid.trim().length > 0) {
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
            }.bind(this));
        },
		deletePrivilege: function (event) {
			let uuid = this.$('input[name=privilege_name]').attr('uuid');
			notification.showConfirmationDialog(function () {

				privilegeFunctions.deletePrivilege(uuid, function (response) {
                    this.close();
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
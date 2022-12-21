define(["backbone","handlebars",  "role/addRole", "text!role/roleManagement.hbs", "role/roleMenu", "text!role/roleTable.hbs", "common/modal", "picSure/roleFunctions", "util/notification","picSure/privilegeFunctions"],
		function(BB, HBS, AddRoleView, template, roleMenu, roleTableTemplate, modal, roleFunctions, notification, privilegeFunctions){
	var roleManagementModel = BB.Model.extend({
	});

	var roleManagementView = BB.View.extend({
		// connections : connections,
		template : HBS.compile(template),
		initialize : function(opts){

		},
		events : {
			"click .add-role-button":   "addRoleMenu",
			"click .role-row":          "showRoleAction",
			"click #delete-role-button":"deleteRole",
			"submit":                   "saveRoleAction",
		},
		displayRoles: function (result, view) {
			this.roleTableTemplate = HBS.compile(roleTableTemplate);
			$('.role-data', this.$el).html(this.roleTableTemplate({roles:result}));

		},
		addRoleMenu: function (result) {
			privilegeFunctions.fetchPrivileges(this, function(privileges,view){
				view.showAddRoleMenu(privileges, view);
			});
		},
		showAddRoleMenu: function(result, view) {
			modal.displayModal(new AddRoleView({managementConsole: this, privileges:result}),
				"Add Privilege",
				() => {this.render(); $('.add-role-button').focus();},
				{handleTabs: true});
		},
		editRoleMenu: function (events) {
            privilegeFunctions.fetchPrivileges(this, function(privileges,view){
                view.showEditRoleMenu(privileges, view);
            });
		},
		showEditRoleMenu: function(result, view){
			modal.displayModal(new AddRoleView({managementConsole: this, applications:result.applications}), "Add Privilege", () => {this.render(); $('.add-role-button').focus();}, {handleTabs: true});
		},
		showRoleAction: function (event) {
			const uuid = event.target.id;

			roleFunctions.showRoleDetails(uuid, function(result) {
				this.model.set("selectedRole", result);
                privilegeFunctions.fetchPrivileges(this, function(privileges){
					modal.displayModal(new roleMenu({
						createOrUpdateRole: false,
						role: this.model.get("selectedRole"), 
						privileges:privileges,
						model: this.model}),
						'Role Info', 
						()=>{this.render(); $(event.target).focus()},
						{handleTabs: true});
                }.bind(this));
			}.bind(this));
		},
		deleteRole: function (event) {
			var uuid = this.$('input[name=role_name]').attr('uuid');
			notification.showConfirmationDialog(function () {

				roleFunctions.deleteRole(uuid, function (response) {
				this.render();
				}.bind(this));

			}.bind(this));
		},
		closeDialog: function () {
			// cleanup
			this.model.unset("selectedRole");
			$("#modalDialog").hide();
		},
		render : function(){
			this.$el.html(this.template({}));
			roleFunctions.fetchRoles(this, function(roles){
				this.displayRoles.bind(this)
				(
						roles
				);
			}.bind(this));
		}
	});

	return {
		View : roleManagementView,
		Model: roleManagementModel
	};
});
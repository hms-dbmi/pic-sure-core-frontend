define(["backbone","handlebars",  "privilege/addPrivilege", "text!privilege/privilegeManagement.hbs",
		"privilege/privilegeMenuView", "text!privilege/privilegeTable.hbs", "common/modal",
		"picSure/privilegeFunctions", 'picSure/applicationFunctions'],
		function(BB, HBS, AddPrivilegeView, template, privilegeMenuView,
				 privilegeTableTemplate, modal, privilegeFunctions, applicationFunctions){
	var privilegeManagementModel = BB.Model.extend({
	});

	var privilegeManagementView = BB.View.extend({
		// connections : connections,
		template : HBS.compile(template),
		initialize : function(opts){
		},
		events : {
			"click .add-privilege-button":   "addPrivilegeMenu",
			"click .privilege-row":          "showPrivilegeAction",
		},
		displayPrivileges: function (result, view) {
			this.privilegeTableTemplate = HBS.compile(privilegeTableTemplate);
			$('.privilege-data', this.$el).html(this.privilegeTableTemplate({privileges:result}));

		},
		dropdownChange: function(event){
			var selects = $('#application-dropdown option:selected', this.$el);
			$('.application-block #uuid').text(selects[0].value);
			if (selects[0].value){
                $('.application-block #name').text(selects[0].innerText);
                $('.application-block #description').text(selects[0].attributes.description.value);
			} else {
                $('.application-block #name').text("");
                $('.application-block #description').text("");
			}

		},
		addPrivilegeMenu: function (result) {
			applicationFunctions.fetchApplications(this, function(applications,view){
				view.showAddPrivilegeMenu({applications : applications}, view);
			});
		},
		showAddPrivilegeMenu: function(result, view) {
            // $("#modal-window", this.$el).html(this.modalTemplate({title: "Add Privilege"}));
            // $("#modalDialog", this.$el).show();
            // var addPrivilegeView = new AddPrivilegeView({el:$('.modal-body'), managementConsole: this, applications:result.applications}).render();
			modal.displayModal(new AddPrivilegeView({managementConsole: this, applications:result.applications}), "Add Privilege", () => {this.render(); $('.add-privilege-button').focus();}, {handleTabs: true});
		},
		showPrivilegeAction: function (event) {
			var uuid = event.target.id;

			privilegeFunctions.showPrivilegeDetails(uuid, function(result) {
				this.model.set("selectedPrivilege", result);
                applicationFunctions.fetchApplications(this, function(applications){
					modal.displayModal(new privilegeMenuView({
						createOrUpdatePrivilege: false,
						privilege: this.model.get("selectedPrivilege"),
						applications: applications,
						privilegeManagementRef: this
					}), "Edit Privilege", () => {this.render(); $('edit-privilege-button').focus();}, {handleTabs: true});
                    // this.applyOptions(this.model.get("selectedPrivilege"));
                }.bind(this));
			}.bind(this));
		},
		render : function(){
			this.$el.html(this.template({}));
			privilegeFunctions.fetchPrivileges(this, function(privileges){
				this.displayPrivileges.bind(this)(privileges);
			}.bind(this));
		}
	});

	return {
		View : privilegeManagementView,
		Model: privilegeManagementModel
	};
});
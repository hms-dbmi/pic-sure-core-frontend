define(["backbone","handlebars", "user/addUser", "text!user/userManagement.hbs",
	"user/userDetails", "text!user/userTable.hbs", "picSure/userFunctions", "picSure/picsureFunctions", "util/notification",
	"common/modal"],
	function(BB, HBS,  AddUserView, template, userDetailsView,
			userTableTemplate, userFunctions, picsureFunctions, notification, modal){
	var userManagementModel = BB.Model.extend({
	});

	var userManagementView = BB.View.extend({
		template : HBS.compile(template),
		initialize : function(opts){
			HBS.registerHelper('fieldHelper', function(user, connectionField){
				if (user.generalMetadata == null || user.generalMetadata === '') {
					return "NO_GENERAL_METADATA";
				}
				else {
					return JSON.parse(user.generalMetadata)[connectionField.id];
				}
			});
			HBS.registerHelper('requiredFieldValue', function(userMetadata, metadataId){
				if (userMetadata)
					return userMetadata[metadataId];
				else
					return "";
			});
			HBS.registerHelper('displayUserRoles', function(roles){
				return _.pluck(roles, "name").join(", ");
			});
		},
		connections : function(callback){
			picsureFunctions.getConnection("", false, callback);
		},		
		events : {
			"click .add-user-button":   "addUserMenu",
			"click .user-row":          "showUserAction",
			"click .close":             "closeDialog",
			"click #cancel-user-button":"closeDialog",
			"click #switch-status-button":"deactivateUser",
			"click .btn-show-inactive":	"toggleInactive"
		},
		updateUserTable: function(connections){
			$('.user-data', this.$el).html(this.userTableTemplate({connections:connections}));
		},
		displayUsers: function (result, view) {
			this.userTableTemplate = HBS.compile(userTableTemplate);
			this.updateUserTable(result.connections);
		},
		addUserMenu: function (result) {
			modal.displayModal(new AddUserView({model: this.model, managementConsole: this}), "Add User", ()=>{$('.add-user-button').focus(); this.render();}, {isHandleTabs: true});
		},
		showUserAction: function (event) {
			var uuid = event.target.id;
			userFunctions.showUserDetails(uuid, function(result) {
				this.connections(function(connections){
					var requiredFields = _.where(connections, {id: result.connection.id})[0].requiredFields;
					if (result.generalMetadata){
						result.generalMetadata = JSON.parse(result.generalMetadata);
					}
					this.model.set("selectedUser", result);
					modal.displayModal(new userDetailsView({model: this.model, createOrUpdateUser: false, user: this.model.get("selectedUser"), requiredFields: JSON.parse(this.model.get("selectedUser").connection.requiredFields)}), "User info", ()=>{$('.user-row').focus(); this.render();}, {isHandleTabs: true});
				}.bind(this));
			}.bind(this));
		},
		getUserRoles: function (stringRoles) {
			var roles = stringRoles.split(",").map(function(item) {
				return item.trim();
			});
			this.model.get("selectedUser").roles = roles;
		},
		closeDialog: function () {
			// cleanup
			this.model.unset("selectedUser");
			$(".close").click();
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
		updateRoles : function(){
			var model = this.model;
			userFunctions.getAvailableRoles(function (roles) {
				model.set("availableRoles", roles);
			});
		},
		render : function(){
			this.$el.html(this.template({}));
			this.updateRoles();
			userFunctions.fetchUsers(this, function(userList){
				var users = [];
				var inactiveUsers = [];
				_.each(userList, function(user){
					if (user.active) {
						users.push(user);
					}
					else {
						inactiveUsers.push(user);
					}
				});
				this.connections(function(connections){
					this.displayUsers.bind(this)({
						connections:
							_.map(connections, function(connection){
								var localCon = connection;
								if(typeof connection.requiredFields === "string"){
									// TODO : this should not be necessary
									connection.requiredFields = JSON.parse(connection.requiredFields);									
								}
								return _.extend(connection, {
									users: users.filter(
											function(user){
												if (user.connection)
													return user.connection.id === connection.id;
												else
													return false;
											}),
											inactiveUsers: inactiveUsers.filter(function(user){
												if (user.connection)
													return user.connection.id === connection.id;
												else
													return false;
											})
								})
							})
					});
				}.bind(this));
			}.bind(this));
		}
	});

	return {
		View : userManagementView,
		Model: userManagementModel
	};
});
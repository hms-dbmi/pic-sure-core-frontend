define(["backbone","handlebars", "text!connection/connectionManagement.hbs", "text!connection/connectionTable.hbs", "picSure/picsureFunctions", "connection/crudConnectionView", "util/notification", "common/modal"],
		function(BB, HBS,  template, connectionTableTemplate, picsureFunctions, crudView, notification, modal){
	var connectionManagementModel = BB.Model.extend({
	});

	var ConnectionModel = BB.Model.extend({
        defaults : {
            uuid : null,
            label : null,
            id : null,
            subPrefix: null,
			requiredFields: [{label: null, id: "email"}]
        }
    });

	var connectionManagementView = BB.View.extend({
        template : HBS.compile(template),
		initialize : function(opts){
            HBS.registerHelper('displayField', function(jsonFields){
                var fields = JSON.parse(jsonFields);
                var html = "";
                fields.forEach(function(field){
                    html += "<div>Label: " + field.label + ", ID: " + field.id + "</div>";
                });
                return html;
            });
            this.connectionTableTemplate = HBS.compile(connectionTableTemplate);
		},
		events : {
			"click .add-connection-button":   	"addConnectionMenu",
			"click .selection-row":     		"showConnectionAction"
		},
		displayConnections: function (result, view) {
			$('.connection-data', this.$el).html(this.connectionTableTemplate({connections:result}));

		},
		addConnectionMenu: function (result) {
            var newConnection = new ConnectionModel();
            this.model.set("selectedConnection", newConnection);
            modal.displayModal(new crudView({connection: newConnection.attributes, createOrUpdateConnection: true, model: this.model}), "Add Connection", () => {this.render(); $('add-connection-button').focus()}, {handleTabs: true});
		},
		showConnectionAction: function (event) {
			var uuid = event.target.id;
			picsureFunctions.getConnection(uuid, false, function(result) {
                var connection = new ConnectionModel(result);
                connection.set("requiredFields", JSON.parse(connection.get("requiredFields")));
				this.model.set("selectedConnection", connection);
                modal.displayModal(new crudView({connection: connection.attributes, createOrUpdateConnection: false, model: this.model}), "Connection info", () => {this.render(); $(event.target).focus()}, {handleTabs: true});
			}.bind(this));
		},
		render : function(){
			this.$el.html(this.template({}));
			picsureFunctions.getConnection("", true, function(connections){
				this.displayConnections(connections);
			}.bind(this));
		}
	});

	return {
		View : connectionManagementView,
		Model: connectionManagementModel
	};
});
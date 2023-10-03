define([
    'backbone',
    'handlebars',
    'underscore',
    'text!connection/crudConnection.hbs',
    'picSure/picsureFunctions',
    'util/notification',
], function(BB, HBS, _, template, picsureFunctions, notification) {
    var CrudConnectionView = BB.View.extend({
        initialize: function(opts){
            this.opts = opts;
            this.connection = opts.connection;
            this.createOrUpdateConnection = opts.createOrUpdateConnection;
            this.model = opts.model;
            HBS.registerHelper('ifEquals', function(a, b, options) {
                if (a === b) {
                    return options.fn(this);
                }
                return options.inverse(this);
            });
            this.template = HBS.compile(template);
        },
        events: {
            "click .add-field-button":			"addConnectionField",
            "click .remove-field-button":		"removeConnectionField",
			"click #edit-button":  				"editConnectionMenu",
            "click #delete-button":				"deleteConnection",
			"click #cancel-button":				"closeDialog",
			"submit":                   		"saveConnectionAction"
        },
        addConnectionField: function (events) {
            this.updateConnectionModel();
        	this.model.get("selectedConnection").get("requiredFields").push({label: null, id: null});
            this.render();
        },
        removeConnectionField: function (events) {
            var idComponents = event.target.parentNode.id.split("-");
            var elementIndex = idComponents[idComponents.length - 1];

            this.updateConnectionModel();
            if (parseInt(elementIndex) == 0) {
                notification.showWarningMessage("Can't remove first required field.")
            } else {
                this.model.get("selectedConnection").get("requiredFields").splice(elementIndex, 1);
			}
			this.render();
        },
		editConnectionMenu: function (events) {
			this.createOrUpdateConnection = true;
            this.render();
		},
        updateConnectionModel: function () {
            var theConnection = this.model.get("selectedConnection");
            theConnection.set("uuid", this.$('input[name=uuid]').val());
            theConnection.set("label", this.$('input[name=label]').val());
            theConnection.set("id", this.$('input[name=id]').val());
            theConnection.set("subPrefix", this.$('input[name=subPrefix]').val());
            var requiredFields = theConnection.get("requiredFields");
            _.each(requiredFields, function (requiredField, index, list) {
                requiredField.label = this.$('input[name=required-field-label-' + index + ']').val();
                requiredField.id = this.$('input[name=required-field-id-' + index + ']').val();
            }.bind(this));
        },
        saveConnectionAction: function (e) {
            e.preventDefault();
            var requestType = "POST";
            this.updateConnectionModel();
            var theConnection = this.model.get("selectedConnection");
            theConnection.set("requiredFields", JSON.stringify(theConnection.get("requiredFields")));

            var connections = [theConnection];
			if (theConnection.get("uuid")) {
                requestType = "PUT";
			}
            picsureFunctions.createOrUpdateConnection(connections, requestType, function(result) {
                this.render();
            }.bind(this));
        },
		deleteConnection: function (event) {
			var uuid = this.$('input[name=uuid]').val();
			notification.showConfirmationDialog(function () {
				picsureFunctions.deleteConnection(uuid, function (response) {
                    $('.close').click();
				}.bind(this));

			}.bind(this));
		},
		closeDialog: function () {
            this.model.get("selectedConnection").set("requiredFields", []);
            $('.close').click();
		},
        render: function(){
            this.$el.html(this.template(this));
        }
    });
    return CrudConnectionView;
});

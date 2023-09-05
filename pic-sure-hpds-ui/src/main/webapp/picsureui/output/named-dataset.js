define([
    'backbone',
    'handlebars',
    'underscore',
    "common/modal",
    'text!output/named-dataset.hbs',
    'overrides/named-dataset'
], function (BB, HBS, _, modal, view, overrides) {
    return BB.View.extend({
        initialize: function (opts) {
            this.template = HBS.compile(view);
            this.modalSettings = opts.modalSettings;
            this.previousModal = opts.previousModal;
            this.queryUUID = opts.queryUUID;
            this.username = JSON.parse(sessionStorage.getItem("session") || "{}")?.username;
        },
        events: {
            'click #cancel-btn': 'onClose',
            'click #save-btn': 'onSave',
            "click #copy-queryid-btn" : "copyQueryId",
        },
        modalReturn: function(){
            if (!this.previousModal) return;
            const { view, title, onClose, options } = this.previousModal;
            modal.displayModal(view, title, onClose, options);
        },
        onClose: function() {
            this.modalSettings.onClose();
            this.modalReturn();
        },
        onError: function(text){
            $('#errors').html(text);
            $("#errors").removeClass('hidden');
        },
        onSave: function() {
            if (overrides && overrides.onSave) {
                overrides.onSave();
                return;
            }

            const name = $("#dataset-name").val();
            if(name === ""){
                this.onError("Please input a Dataset ID Name value");
                $("#dataset-name").addClass('error');
                return;
            }
            
            $("#dataset-name").removeClass('error');
            $("#errors").addClass('hidden');

            $.ajax({
                url: window.location.origin + "/picsure/dataset/named",
                type: 'POST',
                headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                contentType: 'application/json',
                data: JSON.stringify({
                    "queryId": this.queryUUID,
                    "name": name
                }),
                success: function(){
                    this.modalSettings.onSuccess(name);
                    this.modalReturn();
                }.bind(this),
                error: function(response, status, error){
                    this.onError("An error happened during request.");
                    console.log(error);
                }.bind(this)
            });
        },
        copyQueryId: function () {
            navigator.clipboard.writeText($("#dataset-id").html());
            document.getElementById('copy-queryid-btn').innerText = "Copied!";
        },
        render: function () {
            this.$el.html(this.template(this));
            overrides.renderOverride && overrides.renderOverride(this);
        }
    });
});
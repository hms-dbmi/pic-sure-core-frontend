define([
    'backbone',
    'handlebars',
    'underscore',
    "common/modal",
    'text!dataset/dataset-save.hbs',
    'overrides/dataset/dataset-save'
], function (BB, HBS, _, modal, template, overrides) {
    return BB.View.extend({
        initialize: function (opts) {
            this.template = HBS.compile(overrides.template ? overrides.template : template);
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
            this.modalReturn();
            this.modalSettings.onClose();
        },
        onError: function(text){
            $('#errors').html(text);
            $("#errors").removeClass('hidden');
        },
        validateError: function(name){
            if(name === ""){
                return "Please input a Dataset ID name";
            }
            const validName = /^[\w\d \-\\/?+=\[\]\.():"']+$/g;
            if(!name.match(validName)){
                return "Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : &apos; &quot;";
            }
            return false;
        },
        onSave: function() {
            if (overrides && overrides.onSave) {
                overrides.onSave(this);
                return;
            }

            const name = $("#dataset-name").val();
            const validationError = this.validateError(name);
            if(validationError){
                this.onError(validationError);
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
            
            this.previousModal && $('.close')?.off('click');
            this.previousModal && $('.close')?.on('click', this.onClose.bind(this));

            overrides.renderExt && overrides.renderExt(this);
            modal.createTabIndex(); // always do this at end
        }
    });
});
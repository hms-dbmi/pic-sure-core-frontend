define(["backbone", "handlebars", "picSure/roleFunctions", "text!role/addManualStudy.hbs", "util/notification"],
		function(BB, HBS, roleFunctions, template, notification){
	var view = BB.View.extend({
		initialize: function(){
			this.template = HBS.compile(template);
		},
		events: {
			"click #save-manual-study-button": "createManualStudy",
            "click #cancel-manual-study-button": "closeModal",
		},
		createManualStudy: function(){
            let studyId = $('#study-identifier').val();
            const consentCode = $('#consent-code').val();
            if (!studyId) {
                notification.showFailureMessage('Error: study-identifier cannot be blank');
                return;
            }
            studyId = !consentCode ? studyId : studyId + "." + consentCode;
            const encodedStudyId = encodeURI(studyId);
            if (encodeURI(studyId) !== studyId) {
                notification.showFailureMessage('Error: study-identifier contains invalid characters');
                return;
            }
            
			roleFunctions.addManualStudy(encodedStudyId, function(){
				this.closeModal();
			}.bind(this));
		},
        closeModal: function(){
            $('.close').click();
        },
		render: function(){
			this.$el.html(this.template());
			// this.renderConnectionForm({target:{value:this.connections[0].id}})
		}
	});
	return view;
});
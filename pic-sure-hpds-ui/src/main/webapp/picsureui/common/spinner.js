define(["jquery", "text!common/spinner.hbs", "handlebars"], 
		function($, template, HBS){
	var template = HBS.compile(template);
	
	HBS.registerPartial("spinner", template);
	
	var createSpinner = function(deferredAction, targetDivSelector, classes){
		$.when(deferredAction).then(function(){
			if(typeof targetDivSelector === "function"){
				targetDivSelector.html("");
			}else{
				$(targetDivSelector).html("");				
			}
		});
		$(targetDivSelector).html(template(classes))
	};
	
	var createSmallSpinner = function(deferredAction, targetDivSelector, classes){
		createSpinner(deferredAction, targetDivSelector, "spinner-center " + classes);
	};
	
	var createMediumSpinner = function(deferredAction, targetDivSelector, classes){
		createSpinner(deferredAction, targetDivSelector, "spinner-medium spinner-medium-center " + classes);
	};
	
	var createLargeSpinner = function(deferredAction, targetDivSelector, classes){
		createSpinner(deferredAction, targetDivSelector, "spinner-large spinner-large-center " + classes);
	};
	
	return {
		small : createSmallSpinner,
		medium : createMediumSpinner,
		large : createLargeSpinner
	};
});
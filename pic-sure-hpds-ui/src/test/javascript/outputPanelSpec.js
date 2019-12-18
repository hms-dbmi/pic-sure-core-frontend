define(["output/outputPanel", "jquery", "text!../settings/settings.json", "underscore"], function(outputPanel, $, settings, _){
	jasmine.pp = function(obj){return JSON.stringify(obj, undefined, 2);};
	
	describe("outputPanel", function(){
		
		describe("as a module", function(){
			
			it("is an object with an instantiated Backbone view in it accessible by the name View and with a client id", function(){
				expect(outputPanel.View.cid).toBeDefined();
			});			
			
		});
		
		describe("renders", function(){
			beforeEach(function(){
				outputPanel.View.render();
			});
			
//			it("displays < 10 for a main patient count.", function(){
//				expect($('#patient-count', outputPanel.View.$el).text()).toBe("< 10");
//			});
			
			it("provides a main spinner", function(){
				expect($('#spinner-total', outputPanel.View.$el).html()).toBeDefined();
			});
			
			describe("displays one sub-count for each defined resource", function(){
				_.each(JSON.parse(settings.resources), function(resource){
					
					it("displays a sub-count for resource " + resource.name, function(){
						expect($('#patient-count-' + resource.id, outputPanel.View.$el).html()).toBeDefined();						
					});
			
					it("provides a spinner for resource " + resource.name, function(){
						expect($('#spinner-' + resource.id, outputPanel.View.$el).html()).toBeDefined();
					});
				});
			});
		});
	});
});
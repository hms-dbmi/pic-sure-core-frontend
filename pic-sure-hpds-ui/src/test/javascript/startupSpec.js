define(["jquery"], function($){
	jasmine.pp = function(obj){return JSON.stringify(obj, undefined, 2);};
	describe("startup", function(){
		describe("when user is not logged in", function(){
			beforeEach(function(){
				localStorage.id_token=undefined;
			});
			it("renders the login page", function(){
				expect($('#frmAuth0Login')).toBeDefined();
			});
			
		});
		
		describe("when user is logged in", function(){
			beforeEach(function(){
				localStorage.id_token="foobar";
			});
			it("appends an empty outputPanel", function(){
				expect($('#query-results div #patient-count-box')).toBeDefined();
			});
			
			it("initializes the filterList", function(){
				expect($('#query-builder#query-results')).toBeDefined();
			});
			
		});
	
	});
});
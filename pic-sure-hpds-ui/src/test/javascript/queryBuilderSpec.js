define(["picSure/queryBuilder", "filter/filter", "jquery"],  function(queryBuilder, filter, $) {
	jasmine.pp = function(obj){return JSON.stringify(obj, undefined, 2);};
	describe("queryBuilder", function() {
		describe("as a module", function(){
			it("is an object with a function called createQuery", function(){
				expect(typeof queryBuilder.createQuery).toEqual("function");
			});
		});
		
		it("generates a properly formed query when a single pui is selected and is not a negation", function() {
			var expectedQuery = 
			{
					"where": [
						{
							"field": {
								"pui": "Asthma",
								"dataType": "STRING"
							},
							"logicalOperator": "AND",
							"predicate": "CONTAINS",
							"fields": {
								"ENCOUNTER": "YES"
							}
						}
					]
			}
			expect(queryBuilder.createQuery([new filter.Model({inclusive:true, searchTerm: "Asthma", and: false,theList:null})])).toEqual(expectedQuery);
		});
		
		it("generates a properly formed query when a single pui is selected and is a negation", function() {
			var expectedQuery = 
			{
					"where": [
						{
							"field": {
								"pui": "Asthma",
								"dataType": "STRING"
							},
							"logicalOperator": "NOT",
							"predicate": "CONTAINS",
							"fields": {
								"ENCOUNTER": "YES"
							}
						}
					]
			}
			expect(queryBuilder.createQuery([new filter.Model({inclusive:false, searchTerm: "Asthma", and: false,theList:null})])).toEqual(expectedQuery);
		});
		
		it("generates a properly formed query when two puis are or'd and the first one is a negation", function() {
			var expectedQuery = 
			{
					"where": [
						{
							"field": {
								"pui": "Asthma",
								"dataType": "STRING"
							},
							"logicalOperator": "NOT",
							"predicate": "CONTAINS",
							"fields": {
								"ENCOUNTER": "YES"
							}
						},
						{
							"field": {
								"pui": "Epilepsy",
								"dataType": "STRING"
							},
							"logicalOperator": "OR",
							"predicate": "CONTAINS",
							"fields": {
								"ENCOUNTER": "YES"
							}
						}
					]
			}
			expect(queryBuilder.createQuery([
				new filter.Model({inclusive:false, searchTerm: "Asthma", and: false,theList:null}),
				new filter.Model({inclusive:true, searchTerm: "Epilepsy", and: true,theList:null})
			])).toEqual(expectedQuery);
		});		
		
		it("generates a properly formed query when two puis are or'd and neither is a negation", function() {
			var expectedQuery = 
			{
					"where": [
						{
							"field": {
								"pui": "Asthma",
								"dataType": "STRING"
							},
							"logicalOperator": "AND",
							"predicate": "CONTAINS",
							"fields": {
								"ENCOUNTER": "YES"
							}
						},
						{
							"field": {
								"pui": "Epilepsy",
								"dataType": "STRING"
							},
							"logicalOperator": "OR",
							"predicate": "CONTAINS",
							"fields": {
								"ENCOUNTER": "YES"
							}
						}
					]
			}
			expect(queryBuilder.createQuery([
				new filter.Model({inclusive:true, searchTerm: "Asthma", and: false,theList:null}),
				new filter.Model({inclusive:true, searchTerm: "Epilepsy", and: true,theList:null})
			])).toEqual(expectedQuery);
		});
	});
});
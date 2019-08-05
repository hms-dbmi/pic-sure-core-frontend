define([ "text!../settings/settings.json" ], function(settings){
	var createQuery = function(filters){
		var query = {
			resourceUUID: JSON.parse(settings).picSureResourceId,
			query:{
			categoryFilters: {},
			numericFilters:{},
			requiredFields:[],
			variantInfoFilters:[
				{
					categoryVariantInfoFilters:{},
					numericVariantInfoFilters:{}
				}
			],
			expectedResultType: "COUNT"
		}};
		var lastFilter = undefined;
		_.each(filters, function(filter){
			if(filter.get("searchTerm").trim().length !== 0){
				if(filter.attributes.constrainByValue){
					if(filter.attributes.valueType==="INFO"){
						var variantInfoFilter = {};
						query.query.variantInfoFilters[0].categoryVariantInfoFilters[filter.attributes.category] = filter.attributes.variantInfoConstraints.categoryVariantInfoFitlers[filter.attributes.category];
						query.query.variantInfoFilters[0].numericVariantInfoFilters[filter.attributes.category] = filter.attributes.variantInfoConstraints.numericVariantInfoFilters[filter.attributes.category];
					} else if(filter.attributes.valueType==="NUMBER"){
						var one = filter.attributes.constrainParams.attributes.constrainValueOne;
						var two = filter.attributes.constrainParams.attributes.constrainValueTwo;
						var min, max;
						if(filter.attributes.constrainParams.attributes.valueOperator==="LT"){
							max = one;
						}else if(filter.attributes.constrainParams.attributes.valueOperator==="GT"){
							min = one;
						}else{
							min = one;
							max = two;
						}
						query.query.numericFilters[filter.get("searchTerm")] =
						{
								min: min,
								max: max
						}
					}else if(filter.attributes.valueType==="STR"){
						if(filter.get("constrainParams").get("constrainValueOne")==="Any Value"){
							query.query.requiredFields.push(filter.get("searchTerm"));
						}else{
							query.query.categoryFilters[filter.get("searchTerm")] = [filter.get("constrainParams").get("constrainValueOne")];
						}
					}else if(filter.attributes.valueType==="VARIANT"){
						var zygosities = [];
						query.query.categoryFilters[filter.get("constrainParams").get("constrainValueOne").split(/[:_/]/).join(",")] = zygosities;
						var zygosityText = filter.get("constrainParams").get("constrainValueTwo").trim();
						if(zygosityText.includes("Homozygous")){
							zygosities.push("1/1");
						}
						if(zygosityText.includes("Heterozygous")){
							zygosities.push("0/1");
						}
						if(zygosityText.includes("Exclude Variant")){
							zygosities.push("0/0");
						}
					}
				}else{
					query.query.requiredFields.push(filter.get("searchTerm"));
				}

			}
			lastFilter = filter;
		});
		return query;
	};


	return {
		createQuery
	}
});

define([ "text!../settings/settings.json" ], function(settings){

    var queryTemplate = {
        categoryFilters: {},
        numericFilters:{},
        requiredFields:[],
	anyRecordOf:[],
        variantInfoFilters:[
            {
                categoryVariantInfoFilters:{},
                numericVariantInfoFilters:{}
            }
        ],
        expectedResultType: "COUNT"
    };

	var createQuery = function(filters){
		var parsedSess = JSON.parse(sessionStorage.getItem("session"));
		if(parsedSess.queryTemplate){
			return generateQuery(filters,JSON.parse(parsedSess.queryTemplate));
		} else {
			return generateQuery(filters,JSON.parse(JSON.stringify(queryTemplate)));
		}
	};

	var generateQuery = function(filters, template) {
		if (!template)
			template = JSON.parse(JSON.stringify(queryTemplate));

		var query = {
			resourceUUID: JSON.parse(settings).picSureResourceId,
			query: template};

		var lastFilter = undefined;
		_.each(filters, function(filter){
			if(filter.get("searchTerm").trim().length !== 0){
				if ( filter.attributes.valueType === "ANYRECORDOF" ){
                                                //any record of filter should just pull the list of observations  and stuff them in the list.
                                                query.query.anyRecordOf = filter.get("anyRecordCategories");
				} else if(filter.attributes.constrainByValue || filter.get("constrainParams").get("constrainByValue")){
					if(filter.attributes.valueType==="INFO"){
						var variantInfoFilter = {};
						query.query.variantInfoFilters[0].categoryVariantInfoFilters[filter.attributes.category] = filter.get("constrainParams").get("constrainValueOne");
						query.query.variantInfoFilters[0].numericVariantInfoFilters[filter.attributes.category] = filter.attributes.variantInfoConstraints.numericVariantInfoFilters[filter.attributes.category];
					} else if(filter.attributes.valueType==="NUMBER"){
						var one = filter.attributes.constrainParams.attributes.constrainValueOne;
						var two = filter.attributes.constrainParams.attributes.constrainValueTwo;
						var min, max;
						if(filter.attributes.constrainParams.attributes.valueOperator==="LT"){
							max = one;
						}else if(filter.attributes.constrainParams.attributes.valueOperator==="GT"){
							min = two;
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
						if(filter.get("constrainParams").get("constrainValueOne")==="Any Value"
							|| filter.get("constrainParams").get("constrainValueOne").length == 0){
							query.query.requiredFields.push(filter.get("searchTerm"));
						}else{
							//Categorical filters are already an array
							if ( filter.get("constrainParams").get("columnDataType") == "CATEGORICAL" ){
								query.query.categoryFilters[filter.get("searchTerm")] = filter.get("constrainParams").get("constrainValueOne");
							} else{
								query.query.categoryFilters[filter.get("searchTerm")] = [filter.get("constrainParams").get("constrainValueOne")];
							}
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
		createQuery:createQuery
	}
});

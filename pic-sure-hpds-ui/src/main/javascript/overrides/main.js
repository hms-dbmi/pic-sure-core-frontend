define([],function(){
	require.config({
		paths: {
			/*
			 *  Any module in the app can be overridden here. Just add a path entry for
			 *  the desired module and point it at your new module.
			 *  
			 *  This is used in the GRIN project to override the queryBuilder enabling
			 *  support for the gNOME PIC-SURE RI.
			 *  
			 *  This must be a valid requirejs config call.
			 *  
			 *  For example to override the queryBuilder and the login page:
			 *  
			 *  "picSure/queryBuilder" : "path/in/src/main/javascript/newQueryBuilder",
			 *  "common/login" : "path/in/src/main/javascript/newLogin"
			 */
			"picSure/ontology" : "picsureui/ontology",
			"filter/searchResult" : "picsureui/searchResult",
			"filter/searchResults" : "picsureui/searchResults",
			"filter/searchResultTabs" : "picsureui/searchResultTabs",
			"output/outputPanel" : "picsureui/outputPanel",
			"styles" : "picsureui/styles",
			"filter/filter" : "picsureui/filter",
			"header/header" : "picsureui/header",
			"common/startup" : "picsureui/startup",
			"common/mainLayout" : "picsureui/mainLayout",
			"picSure/queryBuilder" : "picsureui/queryBuilder",
			"filter/filterList":"picsureui/filterList",
			"filter/constrainFilterMenu":"picsureui/constrainFilterMenu",
			"filter/constrainFilterMenuCategories":"picsureui/constrainFilterMenuCategories",
			"filter/constrainFilterMenuGenetics":"picsureui/constrainFilterMenuGenetics",
			"filter/constrainFilterMenuVariantInfo":"picsureui/constrainFilterMenuVariantInfo",
			"jstree":"webjars/jstree/3.3.7/jstree",
			"settings":"settings/settings",
//			"auth/login":"picsureui/login"
		},
		shim: {
			"jstree": {
				deps: ["jquery"]
			}
		}
	});	
});

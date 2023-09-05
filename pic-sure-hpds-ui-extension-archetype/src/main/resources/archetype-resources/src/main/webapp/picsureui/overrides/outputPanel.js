define(["jquery", "handlebars", "backbone", "common/config"], function($, HBS, BB, config){
	return {
		/*
		 * This should be a function that returns the name of a Handlebars partial
		 * that will be used to render the count. The Handlebars partial should be
		 * registered at the top of this module.
		 */
		countDisplayOverride : undefined,
		/*
		 * This is a function that if defined replaces the normal render function
		 * from outputPanel.
		 */
		renderOverride : undefined,
		/*
		 * If you want to replace the entire Backbone.js View that is used for
		 * the output panel, define it here.
		 */
		viewOverride : undefined,
		/*
		 * If you want to replace the entire Backbone.js Model that is used for
		 * the output panel, define it here.
		 */
		modelOverride : undefined,
		/*
		 * In case you want to change the update logic, but not the rendering or
		 * anything else, you can define a function that takes an incomingQuery
		 * and dispatches it to the resources you choose, and handles registering
		 * callbacks for the responses and error handling.
		 */
		update: undefined,
		/*
		 * If you want to show your customized error message, please override this
		 */
		outputErrorMessage: undefined,
		
		/*
		 * A function to make any necessary updates to the query before submitting
		 */
		updateConsentFilters : undefined,
		
		/*
		 * The new hook for overriding all custom query logic.  takes 4 parameters:
		 * outputPanel - default outputPanel object for access to model and other objects, 
		 * incomingQuery - query object to be executed, 
		 * dataCallback - default data callback function, 
		 * errorCallback - default error callback function
		 */
		runQuery: undefined,

		/*
		 * A function add more functionality to the output panel render function. This function will be called after the default render function.
		 */
		renderExt: undefined,

		variantExplorerStatus: config.VariantExplorerStatus.disabled
	};
});

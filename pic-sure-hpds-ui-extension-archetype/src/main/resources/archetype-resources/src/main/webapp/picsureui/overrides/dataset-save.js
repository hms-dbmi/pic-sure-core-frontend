define([
], function() {
    return {
		/*
		 * This is a function that if defined replaces the normal render function
		 * from outputPanel.
		 */
		renderOverride : undefined,

		/*
		* This function validates and saves the data from the form to the 
		* /picsure/dataset/named api endpount
		*/
		onSave: undefined,
    };
});
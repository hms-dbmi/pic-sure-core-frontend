define([], function(){
	return {
		/*
		 * A function that takes a PUI that is already split on forward slash and returns
		 * the category value for that PUI.
		 */
		extractCategoryFromPui : undefined,
		
		/*
		 * A function that takes a PUI that is already split on forward slash and returns
		 * the parent value for that PUI.
		 */
		extractParentFromPui : undefined,
		
		/*
		 * A function to perform the initial population of the data export tree
		 */
		loadAllConceptsDeferred : undefined,
		
		/*
		 * A function to perform the inital population of the variant info columns
		 */
		loadAllInfoColumnsDeferred : undefined
	
	};
});
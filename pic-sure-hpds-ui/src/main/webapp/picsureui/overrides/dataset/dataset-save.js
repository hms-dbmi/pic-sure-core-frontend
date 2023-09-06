define([], function() {
    return {
		template: undefined,

		/*
		 * If defined, this function executes after the normal render function.
		 */
		renderExt : undefined,

		/*
		 * This function returns and saves the dataset to the API.
		 */
		onSave: undefined,
    };
});
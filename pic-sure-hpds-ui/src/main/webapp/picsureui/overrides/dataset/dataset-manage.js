define([],  function(){
	return {
		template: undefined,

		/*
		 * This function returns a list of datasets for the current user from the API, then calls the 
		 * renderTable method to populate the DataTables.
		 */
		loadDatasets: undefined,

		/*
		 * This function sends an API request with updated dataset information. (Typically for archive/restore.)
		 */
		updateDataset: undefined,

		/*
		 * This function takes a list of datasets and populates the given DataTable.
		 */
		renderTable: undefined,

		/*
		 * If defined, this function executes after the normal render function.
		 */
		renderExt: undefined,
    };
});
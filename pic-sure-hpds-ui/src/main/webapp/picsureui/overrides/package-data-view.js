define([], function() {
    return {
        /*
		 * Hook to allow overrides to customize the download data function
		 */
        downloadData: undefined,
        /*
		 * Hook to allow overrides to customize the prepare function
		 */
        prepare: undefined,
        /*
		 * Hook to allow overrides to customize the queryAsync function
		 */
        queryAsync: undefined,
        /*
		 * Hook to allow overrides to customize the querySync function
		 */
        querySync: undefined,
        /*
         * Hook to allow overrides to customize the queryChangedCallback function.
         * This function is called when the user makes a change to the tree.
         * The first parameter is a reference to the package view.
        */
        queryChangedCallback: undefined,
        /*
		 * Hook to allow overrides to customize the updateEstimations function
		 */
        updateEstimations: undefined,
        /*
		 * Hook to allow overrides to customize the updateQuery function
		 */
        updateQuery: undefined,

        /*
         * Hook to extend the render function, loaded after the main package dataview render method.
         */
        renderExt: undefined,

        /*
         * Hook to override dataset name box rendering functionality
         */
        updateNamedDatasetObjects: undefined,

        /*
         * Hook to override dataset name api call
         */
        saveDatasetId : undefined,
    };
});
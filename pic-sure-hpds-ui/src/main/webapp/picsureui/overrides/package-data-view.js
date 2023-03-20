define([
], function() {
    return {
        /*
		 * hook to allow overrides to customize the download data function
		 */
        downloadData: undefined,
        /*
		 * hook to allow overrides to customize the prepare function
		 */
        prepare: undefined,
        /*
		 * hook to allow overrides to customize the queryAsync function
		 */
        queryAsync: undefined,
        /*
		 * hook to allow overrides to customize the querySync function
		 */
        querySync: undefined,
        /*
		 * hook to allow overrides to customize the updateEstimations function
		 */
        updateEstimations: undefined,
        /*
		 * hook to allow overrides to customize the updateQuery function
		 */
        updateQuery: undefined,
    };
});
define([], function() {
    return {
		template: undefined,

		/*
		 * If defined, this function executes after the normal render function.
		 */
		renderExt : undefined,

		/*
		 * A list of elements to be populated from the passed in dataset. (Appends to current mapper list.)
		 * List items should be in form:
		 * 
		 * "some handle": { path, renderId, render }, where:
		 *    path: the underscore object path in the dataset object
		 *    renderId: the object id to append to
		 *    render: a pure function that, when given the data at path, will return an html object to append to renderId
		 */
		mappers: [],
    };
});
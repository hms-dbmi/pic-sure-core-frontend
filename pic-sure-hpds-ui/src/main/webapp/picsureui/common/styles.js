define(["jquery", "text!styles.css", "text!bootstrapStyles", "text!treeviewStyles", "text!datatablesStyles", "text!overrides/styles.css"], 
		function($, styles, bootstrapStyles, bootstrapTreeviewStyles, datatablesStyles, overrides){
	$('head').append("<style></style>");
	$('head style').html(
			bootstrapStyles.replace(new RegExp('\.\./fonts/', 'g'),
					'/picsureui/webjars/bootstrap/3.4.1/fonts/')
					+ bootstrapTreeviewStyles + datatablesStyles + styles + overrides);
});
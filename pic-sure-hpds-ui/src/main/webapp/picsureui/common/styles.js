define(["jquery", "text!styles.css", "text!bootstrapStyles", "text!treeviewStyles", "text!datatablesStyles", "text!overrides/styles.css"], 
		function($, styles, bootstrapStyles, bootstrapTreeviewStyles, datatablesStyles, overrides){
	$('head').append("<style></style>");
	$('head style').html(
			bootstrapStyles.replace(new RegExp('\.\./fonts/', 'g'),
					'/picsureui/webjars/bootstrap/5.2.3/fonts/')
					+ bootstrapTreeviewStyles + datatablesStyles + styles + overrides);
});
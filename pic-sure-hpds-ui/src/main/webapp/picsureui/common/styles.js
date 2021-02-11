define(["jquery", "text!styles.css", "text!bootstrapStyles", "text!treeviewStyles", "text!overrides/styles.css"], 
		function($, styles, bootstrapStyles, bootstrapTreeviewStyles, overrides){
	$('head').append("<style></style>");
	$('head style').html(
			bootstrapStyles.replace(new RegExp('\.\./fonts/', 'g'),
					'webjars/bootstrap/4.6.0/fonts/')
					+ bootstrapTreeviewStyles + styles + overrides);
});
define(["backbone","handlebars", "text!footer/footer.hbs", "overrides/footer", "picSure/settings"], 
		function(BB, HBS, template, overrides, settings){
	var footerView = BB.View.extend({
		initialize : function(){
			this.template = HBS.compile(template);
			this.settings = settings;
		},
		render : typeof overrides.render === 'function' ? overrides.render : function(){
			this.$el.html(this.template({ footerMessage : this.settings.footerMessage }));
		}
	});

	return {
		View : footerView
	};
});
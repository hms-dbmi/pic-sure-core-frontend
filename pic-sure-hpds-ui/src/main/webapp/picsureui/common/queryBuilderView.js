define(["filter/filterList", "output/outputPanel", "header/header", "text!common/mainLayout.hbs"], 
		function(filterList, output, header, mainLayoutTemplate){
	var queryBuilderView = function(){
		$('body').html(HBS.compile(layoutTemplate)(JSON.parse(settings)));
		var headerView = header.View;
		headerView.render();
		$('#header-content').append(headerView.$el);
		filterList.init();
		var outputPanel = output.View;
		outputPanel.render();
		$('#query-results').append(outputPanel.$el);		
	};
	return queryBuilderView; 
});
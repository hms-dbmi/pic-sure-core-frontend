define(["jstree", "underscore", "handlebars", "text!picsureui/pickList.hbs", "picSure/ontology"],
		function(jstree, _, HBS, template, ontology){

	var suggestionsToTree = function(suggestions, depth){
		var tree = _.groupBy(suggestions, function(suggestion){
			return suggestion.data.split("\\")[depth];
		});
		_.each(_.keys(tree), function(key){
			if(_.keys(tree[key]).length > 1){
				var subtree = suggestionsToTree(tree[key], depth+1);
				if(key!=""){
					tree[key] =  _.extend(subtree, {text : key, state:{opened:true,disabled:false,selected:false}});
				}
			}else{
				tree[key] = tree[key][0];
			}
		});
		return tree;
	}
	
	ontology.autocomplete("", function(data){
		$('body').append(HBS.compile(template)());
	    // 6 create an instance when the DOM is ready
		var tree = suggestionsToTree(data['suggestions'], 1);
	    $('#jstree').jstree({core:{data:tree}});
	    // 7 bind to events triggered on the tree
	    $('#jstree').on("changed.jstree", function (e, data) {
	      console.log(data.selected);
	    });
	    // 8 interact with the tree - either way is OK
	    $('button').on('click', function () {
	      $('#jstree').jstree(true).select_node('child_node_1');
	      $('#jstree').jstree('select_node', 'child_node_1');
	      $.jstree.reference('#jstree').select_node('child_node_1');
	    });		
	});
});

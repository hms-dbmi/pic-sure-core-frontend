define(["common/spinner", "backbone", "handlebars", "text!output/dataSelection.hbs", "jstree", "picSure/ontology", "picSure/queryCache"], 
	function(spinner, BB, HBS, template, jstree, ontology, queryCache){
		return BB.View.extend({
			template: HBS.compile(template),
			initialize: function(opts){
				this.selectedFields = [];
				this.updateQuery(opts.query);
			},
			events:{
				"click #prepare-btn" : "prepare",
				"prepare" : "prepare"
			},
			updateQuery: function(query){
				this.query = query;
				this.selectedFields = _.uniq(this.selectedFields.concat(query.query.requiredFields)
					.concat(query.fields)
					.concat(_.keys(query.query.categoryFilters))
					.concat(_.keys(query.query.numericFilters)));
			},
			prepare: function(){
				$("#download-btn", this.$el).attr("href", "");
				$("#download-btn", this.$el).addClass('hidden');
				var query = {};
				query = JSON.parse(JSON.stringify(this.query));
				query.query.fields = _.filter($('#concept-tree', this.$el).jstree().get_selected(), function(child){
					var children = $('#concept-tree', this.$el).jstree().get_node(child).children;
					return children == undefined || children.length === 0;
				}.bind(this))
				query.query.expectedResultType="DATAFRAME";
				spinner.small(
					$.ajax({
						url: window.location.origin + "/picsure/query/sync",
						type: 'POST',
						headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
						contentType: 'application/json',
						dataType: 'text',
						data: JSON.stringify(query),
						success: function(response){
							responseDataUrl = URL.createObjectURL(new Blob([response], {type: "octet/stream"}));
							$("#download-btn", this.$el).attr("href", responseDataUrl);
							$("#download-btn", this.$el).removeClass('hidden');
							console.log("done preparing")
						}.bind(this),
						error: function(response){
							console.log("error preparing download : ");
							console.log(response);
						}.bind(this)
					})
					, "#download-spinner"
					, "download-spinner"
					);
			},
			updateCounts: _.debounce(function(){
				$("#concept-tree", this.$el).on("before_open.jstree", function(event, data){
					var query = {};
					query = JSON.parse(JSON.stringify(this.query));
					query.query.expectedResultType="CROSS_COUNT";
					query.query.crossCountFields = _.filter(data.node.children, function(child){
						var children = $('#concept-tree', this.$el).jstree().get_node(child).children;
						return children == undefined || children.length === 0;
					}.bind(this));
					$.ajax({
						url: window.location.origin + "/picsure/query/sync",
						type: 'POST',
						headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
						contentType: 'application/json',
						data: JSON.stringify(query),
						success: function(crossCounts){
							_.each(query.query.crossCountFields, function(child){
								var childNode = $('#concept-tree', this.$el).jstree().get_node(child);
								childNode.text = childNode.text.replace(/<b\>.*<\/b>/,'') +  " <b>(" + crossCounts[child] + " observations in subset)</b>";
								$('#concept-tree', this.$el).jstree().redraw_node(child);
							}.bind(this));
						}.bind(this),
						error: console.log
					});
				}.bind(this));
				$("#concept-tree", this.$el).on("check_node.jstree", function(node, selected, event){
					this.selectedFields.push(node.id);
				}.bind(this));
				$("#concept-tree", this.$el).on("uncheck_node.jstree", function(node, selected, event){
					this.selectedFields = _.without(this.selectedFields(node.id));
				}.bind(this));
			}, 100),
			render: function(){
				this.$el.html(this.template());

				spinner.small(
					ontology.tree(function(tree){
						tree.children = _.sortBy(tree.children, function(entry){return entry.text;});
						var conceptTree = $("#concept-tree", this.$el).jstree({
							core:{
								data:tree,
							},
							"checkbox" : {
								"keep_selected_style" : false
							},
							"plugins":["checkbox"]
						});
							$("#concept-tree", this.$el).on("before_open.jstree", function(event, data){
								var query = {};
								query = JSON.parse(JSON.stringify(this.query));
								query.query.expectedResultType="CROSS_COUNT";
								query.query.crossCountFields = _.filter(data.node.children, function(child){
									var children = $('#concept-tree', this.$el).jstree().get_node(child).children;
									return children == undefined || children.length === 0;
								}.bind(this));
								$.ajax({
									url: window.location.origin + "/picsure/query/sync",
									type: 'POST',
									headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
									contentType: 'application/json',
									data: JSON.stringify(query),
									success: function(crossCounts){
										_.each(query.query.crossCountFields, function(child){
											var childNode = $('#concept-tree', this.$el).jstree().get_node(child);
											childNode.text = childNode.text.replace(/<b\>.*<\/b>/,'') +  " <b>(" + crossCounts[child] + " observations in subset)</b>";
											$('#concept-tree', this.$el).jstree().redraw_node(child);
										}.bind(this));
									}.bind(this),
									error: console.log
								});
							}.bind(this));
							$("#concept-tree", this.$el).on("check_node.jstree", function(node, selected, event){
								this.selectedFields.push(node.id);
							}.bind(this));
							$("#concept-tree", this.$el).on("uncheck_node.jstree", function(node, selected, event){
								this.selectedFields = _.without(this.selectedFields(node.id));
							}.bind(this));
							_.delay(function(){$('.jstree-node[aria-level=1] > .jstree-icon').click();}, 1000);
							$('#prepare-btn').show();
						}.bind(this))
					, "#select-spinner"
					, "select-spinner"
				);
			}
		});
});

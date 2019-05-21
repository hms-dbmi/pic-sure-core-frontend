define(["picSure/ontology", "text!picsureui/searchHelpTooltip.hbs", "output/outputPanel", "overrides/filter", "common/spinner", "backbone", "handlebars", "text!filter/filter.hbs", "text!filter/suggestion.hbs", "filter/searchResults", "picSure/queryCache", "text!filter/constrainFilterMenu.hbs", "text!filter/constrainFilterMenuCategories.hbs", "text!filter/constrainFilterMenuGenetics.hbs", "text!filter/constrainFilterMenuVariantInfo.hbs", "common/notification", "autocomplete", "bootstrap"],
		function(ontology, searchHelpTooltipTemplate, outputPanel, overrides, spinner, BB, HBS, filterTemplate, suggestionTemplate, searchResults, queryCache, constrainFilterMenuTemplate, constrainFilterMenuCategoriesTemplate, constrainFilterMenuGeneticsTemplate, constrainFilterMenuVariantInfoTemplate, notification){
	var valueConstrainModel = BB.Model.extend({
		defaults:{
			constrainByValue: false,
			isValueOperatorBetween: false,
			valueOperator: "LT",
			valueOperatorLabel: "Less than",
			constrainValueOne: "",
			constrainValueTwo: ""
		}
	});
	var filterModel = BB.Model.extend({
		defaults:{
			inclusive: true,
			searchTerm: "",
			and: true,
			constrainByValue: false,
			constrainParams: new valueConstrainModel(),
			variantInfoConstraints:{
				categoryVariantInfoFitlers:{},
				numericVariantInfoFilters:{}
			},
			searching: false
		}
	});
	var filterView = BB.View.extend({
		initialize: function(opts){
			this.template = HBS.compile(filterTemplate);
			this.suggestionTemplate = HBS.compile(suggestionTemplate);
			this.queryCallback = opts.queryCallback;
			this.showSearchResults = this.showSearchResults.bind(this);
			this.removeFilter = opts.removeFilter;
			this.constrainFilterMenuTemplate = HBS.compile(constrainFilterMenuTemplate);
			this.constrainFilterMenuCategoriesTemplate = HBS.compile(constrainFilterMenuCategoriesTemplate);
			this.constrainFilterMenuGeneticsTemplate = HBS.compile(constrainFilterMenuGeneticsTemplate);
			this.constrainFilterMenuVariantInfoTemplate = HBS.compile(constrainFilterMenuVariantInfoTemplate);
		},
		tagName: "div",
		className: "filter-list-entry row",
		events: {
			"selected .search-box" : "onAutocompleteSelect",
			"hidden.bs.dropdown .autocomplete-suggestions .dropdown" : "onAutocompleteSelect",
			"click .filter-dropdown-menu li a" : "onDropdownSelect",
			"click .delete": "destroyFilter",
			"click .edit": "editFilter",
			"click .search-btn": "searchBtnHandler",
			"keyup input.search-box" : "enterButtonEventHandler",
			"click .constrain-dropdown-menu li a" : "onConstrainTypeSelect",
			"click .constrain-category-dropdown-menu li a" : "onConstrainCategorySelect",
			"click .constrain-genetics-dropdown-menu li a" : "onConstrainGeneticsSelect",
			"click .constrain-info-dropdown-menu li a" : "onConstrainVariantInfoSelect",
			"click .value-dropdown-menu li a" : "onValueTypeSelect",
			"focusout .constrain-value" : "onConstrainValuesChange",
			"click .constrain-apply-btn" : "onConstrainApplyButtonClick"
		},
		reset: function () {
			this.model.clear().set(this.model.defaults);
			this.model.set("constrainParams", new valueConstrainModel());
		},
		searchBtnHandler : function(event){
//			this.searchTerm($('.search-box', this.$el).val());
		},
		enterButtonEventHandler : function(event){
			$('.constrain-filter').hide();
			if(event.keyCode == 13){
				overrides.enterKeyHandler ? overrides.enterKeyHandler.apply(this) 
						: function(){
							var term = $('input.search-box', this.$el).val();
							if(term && term.length > 0){
								this.model.set("searchTerm", term);
								this.searchTerm(term);
							}
						}.bind(this)()
			}
		},
		searchTerm : function(term) {
			if((/rs[0-9]+.*/.test(term))||(/\d+:\d+_.*/.test(term))||(/\d+,\d+,.*/.test(term))){
				this.showGeneticSelectionOptions(term);
			}else{
				var deferredSearchResults = $.Deferred();
				ontology.autocomplete(term, deferredSearchResults.resolve);
				$.when(deferredSearchResults).then(this.showSearchResults);				
			}
		},
		showGeneticSelectionOptions : function(term){
			$('.autocomplete-suggestions').hide();
			this.model.set('searching', false);
			this.model.set("constrainByValue", true)
			this.model.get("constrainParams").set("constrainByValue", true);
			this.model.set("searchTerm", term);
			this.model.get("constrainParams").set("constrainValueOne", term);
			this.model.attributes.valueType="VARIANT";
			this.model.attributes.concept={columnDataType:"VARIANT"};
			this.updateConstrainFilterMenu();
		},
		showSearchResults : function(result) {
			$('.autocomplete-suggestions').hide();
			this.model.set('searching', false);
			if(result == undefined) {
				alert("Result error");
			} else {
				$('.search-tabs', this.$el).html('');
				searchResults.init(_.groupBy(result.suggestions, "category"), this, this.queryCallback);
			}
		},
		onDropdownSelect : function(event){
			var dropdownElement = $("."+event.target.parentElement.parentElement.attributes['aria-labelledby'].value, this.$el);
			dropdownElement.text(event.target.text);
			dropdownElement.append(' <span class="caret"></span>');
			this.onSelect(event);
		},
		onAutocompleteSelect : function (event, suggestion) {
			this.model.set('searching', false);
			$('.constrain-filter', this.$el).html("");
			if(suggestion && suggestion.value && suggestion.value.trim().length > 0){
				this.searchTerm(suggestion.value);
			}
			else {
				console.error('Search term is missing, cannot search');
			}
		},
		onSelect : function(event, suggestion){
			console.log("selected");
			if(this.model.attributes.concept.columnDataType==="VARIANT"){

			}else{
				this.model.set("inclusive", $('.filter-qualifier-btn', this.$el).text().trim() === "Must Have");
				this.model.set("and", $('.filter-boolean-operator-btn', this.$el).text().trim() === "AND");
				if(suggestion && suggestion.data){
					this.model.node = suggestion;
					this.model.set("searchTerm", suggestion.data);
				}
			}
			if(this.model.get("searchTerm").trim().length > 0){
				this.queryCallback();				
			}
			$('.search-tabs', this.$el).html('');
		},
		editFilter : function(){
			this.$el.removeClass("saved");
			this.updateConstrainFilterMenu();
		},
		destroyFilter: function () {
			this.undelegateEvents();
			this.$el.removeData().unbind();
			this.remove();
			this.removeFilter(this.cid);
		},
		onConstrainTypeSelect: function (event) {
			var dropdownElement = $("."+event.target.parentElement.parentElement.attributes['aria-labelledby'].value, this.$el);
			dropdownElement.text(event.target.text);
			dropdownElement.append('<span class="glyphicon glyphicon-chevron-down blue"></span>');
			var constrainByValue = $('.value-constraint-btn', this.$el).text().trim() != "No value";
			// update both models
			this.model.set("constrainByValue", constrainByValue)
			this.model.get("constrainParams").set("constrainByValue", constrainByValue);

			this.updateConstrainFilterMenu()
		},
		onConstrainGeneticsSelect: function(event) {
			var dropdownElement = $("."+event.target.parentElement.parentElement.attributes['aria-labelledby'].value, this.$el);
			dropdownElement.text(event.target.text);
			dropdownElement.append('<span class="glyphicon glyphicon-chevron-down blue"></span>');
			var constrainByValue = true;
			// update both models
			this.model.set("constrainByValue", constrainByValue)
			this.model.get("constrainParams").set("constrainByValue", constrainByValue);
			this.model.get("constrainParams").set("constrainValueOne", this.model.attributes.searchTerm);
			this.model.get("constrainParams").set("constrainValueTwo", event.target.text);
			this.model.attributes.valueType="VARIANT";
			this.updateConstrainFilterMenu();
		},
		onConstrainVariantInfoSelect: function(event) {
			var constrainByValue = true;
			// update both models
			this.$el.addClass("variant-info-filter");
			this.model.set("constrainByValue", constrainByValue)
			this.model.get("constrainParams").set("constrainByValue", constrainByValue);
			if(!this.model.attributes.concept.metadata.continuous){
				this.model.get("constrainParams").set("constrainValueOne", "Variants matching");
				this.model.get("constrainParams").set("constrainValueTwo", _.pluck(_.filter($("input[type=radio]", this.$el), {checked:true}), "value"));
				this.model.get("variantInfoConstraints").categoryVariantInfoFitlers[this.model.attributes.concept.category]=this.model.get("constrainParams").get("constrainValueTwo");
			}else{
				this.model.get("constrainParams").set("constrainValueOne", $("input", event.target.parentElement.parentElement)[0].value);
				this.model.get("constrainParams").set("constrainValueTwo", $("input", event.target.parentElement.parentElement)[1].value);		
				this.model.get("variantInfoConstraints").numericVariantInfoFilters[this.model.attributes.concept.category]={min: $("input", event.target.parentElement.parentElement)[0].value, max:  $("input", event.target.parentElement.parentElement)[1].value};
			}
			this.model.attributes.valueType="INFO";
			this.updateConstrainFilterMenu();
		},
		onConstrainCategorySelect: function(event) {
			var dropdownElement = $("."+event.target.parentElement.parentElement.attributes['aria-labelledby'].value, this.$el);
			dropdownElement.text(event.target.text);
			dropdownElement.append('<span class="glyphicon glyphicon-chevron-down blue"></span>');
			var constrainByValue = true;
			// update both models
			this.model.set("constrainByValue", constrainByValue)
			this.model.get("constrainParams").set("valueOperatorLabel","");
			this.model.get("constrainParams").set("constrainByValue", constrainByValue);
			this.model.get("constrainParams").set("constrainValueOne", event.target.text);
			this.updateConstrainFilterMenu()
		},
		onValueTypeSelect : function (event) {
			var dropdownElement = $("."+event.target.parentElement.parentElement.attributes['aria-labelledby'].value, this.$el);
			dropdownElement.text(event.target.text);
			dropdownElement.append('<span class="glyphicon glyphicon-chevron-down blue"></span>');

			var valueOperator = event.target.attributes['value'].value;

			var constrainModel = this.model.get("constrainParams");
			constrainModel.set("valueOperator", valueOperator);
			constrainModel.set("valueOperatorLabel", event.target.text);
			constrainModel.set("isValueOperatorBetween", valueOperator === "BETWEEN")
			this.updateConstrainFilterMenu();
		},
		onConstrainValuesChange : function (event) {
			this.model.get("constrainParams").set("constrainValueOne", $('.constrain-value-one', this.$el).val());
			this.model.get("constrainParams").set("constrainValueTwo", $('.constrain-value-two', this.$el).val());
		},
		updateConstrainFilterMenu : function() {
			if(this.model.attributes.concept.columnDataType==="CONTINUOUS"){
				$('.constrain-filter', this.$el).html(this.constrainFilterMenuTemplate(_.extend(this.model.attributes.constrainParams.attributes,this.model.attributes.concept)));				
			}else if (this.model.attributes.concept.columnDataType==="VARIANT"){
				$('.constrain-filter', this.$el).html(this.constrainFilterMenuGeneticsTemplate(_.extend(this.model.attributes.constrainParams.attributes,this.model.attributes.concept)));
				$('.constrain-filter', this.$el).show();
			}else if (this.model.attributes.concept.columnDataType==="INFO"){
				$('.constrain-filter', this.$el).html(this.constrainFilterMenuVariantInfoTemplate(_.extend(this.model.attributes.constrainParams.attributes,this.model.attributes.concept)));				
			}else {
				$('.constrain-filter', this.$el).html(this.constrainFilterMenuCategoriesTemplate(_.extend(this.model.attributes.constrainParams.attributes,this.model.attributes.concept)));				
			}
		},
		validateConstrainFilterFields : function () {
			var isValid = true;
			$('.constrain-value-one', this.$el).removeClass("field-invalid");
			$('.constrain-value-two', this.$el).removeClass("field-invalid");
			if (this.model.get("constrainByValue") && this.model.attributes.concept.columnDataType==="CONTINUOUS"){
				var constrainParams = this.model.get("constrainParams");
				var constrainValueOne = constrainParams.get("constrainValueOne").trim();

				if (constrainValueOne == "" || isNaN(constrainValueOne)) {
					$('.constrain-value-one', this.$el).addClass("field-invalid");
					isValid = false;
				}
				if (constrainParams.get("isValueOperatorBetween")) {
					var constrainValueTwo = constrainParams.get("constrainValueTwo").trim();
					if (constrainValueTwo == "" || isNaN(constrainValueTwo)) {
						$('.constrain-value-two', this.$el).addClass("field-invalid")
						isValid = false;
					}
				}
			}
			return isValid;
		},
		onConstrainApplyButtonClick : function (event) {
			if (this.validateConstrainFilterFields()) {
				if(this.model.attributes.concept.columnDataType==="INFO"){
					this.onConstrainVariantInfoSelect(event);
					$('.search-value', this.$el).html("Variant Info Column " + this.model.get("category") + ': ' + 
						(this.model.get("constrainParams").get("constrainValueOne")?this.model.get("constrainParams").get("constrainValueOne"):this.model.attributes.concept.metadata.min) 
						+ " - " 
						+ (this.model.get("constrainParams").get("constrainValueTwo")?this.model.get("constrainParams").get("constrainValueTwo"):this.model.attributes.concept.metadata.max));
				}else if(this.model.attributes.concept.columnDataType==="VARIANT"){
					this.model.get("constrainParams").set("constrainValueTwo", $(".value-constraint-genetics-btn", this.$el).text());
					$('.search-value', this.$el).html(this.model.get("constrainParams").get("constrainValueTwo") + " : " + this.model.get("searchTerm"));
				}else{
					if (this.model.get("constrainByValue")){
						var constrains = this.model.get("constrainParams");
						var searchParam = constrains.get("valueOperatorLabel")
						+ " "
						+ constrains.get("constrainValueOne")
						+ (constrains.get("isValueOperatorBetween") ?
								" - " + constrains.get("constrainValueTwo") : "");
						$('.search-value', this.$el).html(this.model.get("searchValue") + ', ' + searchParam);
					}
				}
				this.$el.addClass("saved");
				$('.constrain-filter', this.$el).html("");
				this.onSelect(event);
			} else {
				notification.showValidationMessage("Value required! Correct invalid fields.", '.validation-message');
			}
		},
		geneticSelections: function(searchString){
			if(/\d+,\d+,.*,.*/.test(searchString)||(/\d+:\d+_.*/.test(searchString))){
				console.log(searchString);
				this.searchTerm(searchString);
			}
		},
		render: function(){
			this.$el.html(this.template(this.model.attributes));
			var spinnerSelector = this.$el.find(".spinner-div");

			var model = this.model;

			$('.dropdown-toggle', this.$el).dropdown();

			$('.search-help-tooltip', this.$el).tooltip();
			ontology.allInfoColumnsLoaded.then(function(){
				$('.search-tooltip-help').html(HBS.compile(searchHelpTooltipTemplate)(ontology.allInfoColumns()));
				$('.search-tooltip-help', this.$el).tooltip();
			}.bind(this));

			this.delegateEvents();
		}
	});
	return {
		View : filterView,
		Model : filterModel
	};
});

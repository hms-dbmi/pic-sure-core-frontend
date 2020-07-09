define(["jquery", "picSure/ontology", "text!filter/searchHelpTooltip.hbs", "overrides/filter", "common/spinner", "backbone", "handlebars", "text!filter/filter.hbs", "text!filter/suggestion.hbs", "text!filter/noResults.hbs", "filter/searchResults", "text!filter/constrainFilterMenu.hbs", "text!filter/constrainFilterMenuCategories.hbs", "text!filter/constrainFilterMenuGenetics.hbs", "text!filter/constrainFilterMenuAnyRecordOf.hbs", "text!settings/settings.json", "autocomplete", "bootstrap"],
		function($, ontology, searchHelpTooltipTemplate, overrides, spinner, BB, HBS, filterTemplate, suggestionTemplate, noResultsTemplate, searchResults, constrainFilterMenuTemplate, constrainFilterMenuCategoriesTemplate, constrainFilterMenuGeneticsTemplate, constrainFilterMenuAnyRecordOfTemplate, settings){
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
			this.restoreSearchResults = this.restoreSearchResults.bind(this);
			this.showSearchResults = this.showSearchResults.bind(this);
			this.removeFilter = opts.removeFilter;
			this.constrainFilterMenuTemplate = HBS.compile(constrainFilterMenuTemplate);
			this.constrainFilterMenuCategoriesTemplate = HBS.compile(constrainFilterMenuCategoriesTemplate);
			this.constrainFilterMenuGeneticsTemplate = HBS.compile(constrainFilterMenuGeneticsTemplate);
			// this.constrainFilterMenuVariantInfoTemplate = HBS.compile(constrainFilterMenuVariantInfoTemplate);
			this.constrainFilterMenuAnyRecordOfTemplate = HBS.compile(constrainFilterMenuAnyRecordOfTemplate);			
			
			this.showSearchResults  = overrides.showSearchResults ? overrides.showSearchResults.bind(this) : this.showSearchResults.bind(this);
			this.onSelect = overrides.onSelect ? overrides.onSelect.bind(this) : this.onSelect.bind(this);
			this.render = overrides.render ? overrides.render.bind(this) : this.render.bind(this);
			this.noResultsTemplate = HBS.compile(noResultsTemplate);
			
			$('.search-help-tooltip').tooltip();
			ontology.allInfoColumnsLoaded.then(function(){
				$('.search-tooltip-help').html(HBS.compile(searchHelpTooltipTemplate)(ontology.allInfoColumns()));
				$('.search-tooltip-help', this.$el).tooltip();
			}.bind(this));
		},
		tagName: "div",
		className: "filter-list-entry row",
		events: {
			"selected .search-box" : "onAutocompleteSelect",
			"hidden.bs.dropdown .autocomplete-suggestions .dropdown" : "onAutocompleteSelect",
			"click .filter-dropdown-menu li a" : "onDropdownSelect",
			"click .delete": "destroyFilter",
			"click .change-constraint": "changeConstraint",
			"click .edit": "editFilter",
			"click .back-btn" : "restoreSearchResults",
			"keyup input.search-box" : "enterButtonEventHandler",
			"change .constrain-type-select" : "onConstrainTypeSelect", 
			"click .selectable-category-item" : "onConstrainCategorySelect",
			"click .constrain-genetics-dropdown-menu li a" : "onConstrainGeneticsSelect",
			"change .value-type-select" : "onValueTypeSelect",
			"focusout .constrain-value" : "onConstrainValuesChange",
			"click .constrain-apply-btn" : "onConstrainApplyButtonClick",
			"input .category-filter" : "onCategoryFilterChange",
			"click .select-all" : "selectAllCategories",
			"click .select-none" : "clearCategorySelection",
			"change .category-filter-restriction" : "updateCategoryFilterVisibility",
			"click .anyrecordof-top-label" : "showAnyRecordOfVariables"
		},
		showAnyRecordOfVariables: function(event){
			var valueListEl = $(".anyrecordof-value-list", this.$el);
			if(valueListEl.hasClass("hidden")){
				valueListEl.removeClass("hidden");
			} else {
				valueListEl.addClass("hidden");
			}
		},
		reset: function () {
			this.model.clear().set(this.model.defaults);
			this.model.set("constrainParams", new valueConstrainModel());
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
				
				spinner.small(deferredSearchResults, "#spinner-div", "download-spinner")
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
		restoreSearchResults: function(event){
			//reset search value
			this.model.set("searchTerm", this.originalSearchTerm);
			$(".search-box", this.$el).val(this.originalSearchTerm);
			
			//update UI - restore the input box, hide the buttons, hide any categorical selections, hide other elements.
			this.$el.removeClass("saved");
			$('.constrain-filter', this.$el).html('');
			this.searchTerm(this.originalSearchTerm);
		},
		showSearchResults : function(result) {
			$('.autocomplete-suggestions').hide();
			this.model.set('searching', false);
			if(result == undefined) {
				alert("Result error");
			} else if( result.suggestions.length == 0 ){
				$('.search-tabs', this.$el).html(this.noResultsTemplate());
			} else { 
				//clear out any old data
				$('.search-tabs', this.$el).html('');
				this.originalSearchTerm = this.model.get("searchTerm")
				var categorySearchResultList = JSON.parse(settings).categorySearchResultList;
				var searchResultObject = {};

				//inject these category names first so that the results are in a pre-set order
				_.each(categorySearchResultList, function(item){
					searchResultObject[item] = [];
				});

				_.each(result.suggestions, function(item){
					var key = item.category;
					var array = searchResultObject[key];
					if (array) {
						array.push(item);
					} else {
						searchResultObject[key] = [item];
					};
				});
				
				//we might not have entries for all our predetermined categories; clean them up!
				_.each(_.keys(searchResultObject), function(key){
					if(searchResultObject[key].length === 0){
						delete searchResultObject[key];
					}
				});
				searchResults.init(searchResultObject, this, this.queryCallback);
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
			if ( this.model.attributes.valueType === "ANYRECORDOF" ){
				//model should already be updated.
			}else if(this.model.attributes.concept.columnDataType==="VARIANT"){

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
			this.updateConstrainFilterMenu();
			if (this.model.attributes.concept.columnDataType==="INFO" || 
					this.model.attributes.concept.columnDataType==="CATEGORICAL"){
				$(".category-filter-restriction", this.$el).val("RESTRICT");
			}
		},
		changeConstraint : function (){
			//need to remove the 'anyRecordOf' panel if we are changing constraints
			$(".category-valueof-div", this.$el).hide();
			this.$el.removeClass("saved"); 
		},
		destroyFilter: function () {
			this.undelegateEvents();
			this.$el.removeData().unbind();
			this.remove();
			this.removeFilter(this.cid);
		},
		onConstrainTypeSelect: function (event) {
		
			var constrainByValue = event.target.value != "Any value";
			// update both models
			this.model.set("constrainByValue", constrainByValue)
			this.model.get("constrainParams").set("constrainByValue", constrainByValue);

			if(constrainByValue){
 				$('.value-operator', this.$el).removeClass("hidden")
                                $('.value-operator', this.$el).show();
				$('.value-operator-range-label', this.$el).removeClass("hidden")
                                $('.value-operator-range-label', this.$el).show();
 				var valueOperator = $(".value-type-select", this.$el).val();
				this.updateConstrainValueVisibility(valueOperator);				
			 }  else {
				$('.value-operator').hide();
				$('.value-operator-range-label', this.$el).hide();
			}

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
		updateCategoryFilterVisibility: function (event){
			if( $(".category-filter-restriction", this.$el).val() == "RESTRICT"){
				$(".category-filter-lists", this.$el).removeClass("hidden");
				$(".category-filter-lists", this.$el).show();
			} else {
				$(".category-filter-lists", this.$el).hide();
			}
		},
        selectAllCategories: function(event) {
			var existingItems = $(".selected-categories > option");
                        
            //handle special case where no items in 'selected' control; no logic needed
            if(existingItems.length == 0){
                    $(".selected-categories").append($(".available-categories > option"));
                    return;
            }
            
            var currentItem = existingItems.first();
            $(".available-categories > option").each(function() {
                //comparing text, but one is a func because jquery.each() is different than first()/next()
                
                if(this.text < currentItem.text()){
                        $(this).insertBefore(currentItem);
                } else {
                        while(currentItem.next().length > 0 && this.text > currentItem.next().text()){
                                currentItem = currentItem.next();
                        }
                        
                        $(this).insertAfter(currentItem);
                }
            });

        },
        clearCategorySelection: function(event) {
			var existingItems = $(".available-categories > option");
			
			//handle special case where no items in 'available' control; no logic needed
			if(existingItems.length == 0){
				$(".available-categories").append($(".selected-categories > option"));
				return;
			}

			var currentItem = existingItems.first();
			$(".selected-categories > option").each(function() {
				//comparing text, but one is a func because jquery.each() is different than first()/next()

				if(this.text < currentItem.text()){
					$(this).insertBefore(currentItem);
				} else {
					while(currentItem.next().length > 0 && this.text > currentItem.next().text()){
						currentItem = currentItem.next();
					} 

					$(this).insertAfter(currentItem);
				}
			});
        },
		onConstrainCategorySelect: function(event) {
			//clear selection styling	
			event.target.selected = false;
			
			if(event.target.parentElement.classList.contains("available-categories")){
				//maintain ordered list of options
				var foundPlace = false;
                $(".selected-categories > option").each(function() { 
                        if(this.text > event.target.text){
                                $(event.target).insertBefore(this);
                                foundPlace = true;
                                return false;
                        }

                });     
                if( !foundPlace) {
                        $(".selected-categories", this.$el).append(event.target);
                }
			} else {
				//maintain ordered list of options
				var foundPlace = false;
				$(".available-categories > option").each(function() { 
					if(this.text > event.target.text){
						$(event.target).insertBefore(this);
						foundPlace = true;
						return false;
					}
				});
				if( !foundPlace) {
					$(".available-categories", this.$el).append(event.target);
				}
			}

			var constrainByValue = true;
			// update both models
			this.model.set("constrainByValue", constrainByValue)
			this.model.get("constrainParams").set("valueOperatorLabel","");
			this.model.get("constrainParams").set("constrainByValue", constrainByValue);
		},
		onCategoryFilterChange : function (event) {
	    		$(".available-categories > option").each(function() {
                if(this.text.includes(event.target.value)){
                        $(this).show();
                } else {
                        $(this).hide();
                }
            });
		},
		onValueTypeSelect : function (event) {

			var valueOperator = event.target.value;
			var constrainModel = this.model.get("constrainParams");
			constrainModel.set("valueOperator", valueOperator);
			constrainModel.set("valueOperatorLabel", event.target[event.target.selectedIndex].text);
			constrainModel.set("isValueOperatorBetween", valueOperator === "BETWEEN")
 			this.updateConstrainValueVisibility(valueOperator);
		},
		onConstrainValuesChange : function (event) {
			this.model.get("constrainParams").set("constrainValueOne", $('.constrain-value-one', this.$el).val());
			this.model.get("constrainParams").set("constrainValueTwo", $('.constrain-value-two', this.$el).val());
		},
		updateConstrainValueVisibility : function(valueOperator) {

           if( valueOperator == "BETWEEN" ){
                    $('.constrain-range-separator', this.$el).removeClass("hidden")
                    $('.constrain-range-separator', this.$el).show();
                    $('.constrain-value-one', this.$el).removeClass("hidden");
                    $('.constrain-value-one', this.$el).show();
                    $('.constrain-value-two', this.$el).removeClass("hidden");
                    $('.constrain-value-two', this.$el).show();
            } else {
                    $('.constrain-range-separator', this.$el).hide();
            }

            if( valueOperator == "LT" || valueOperator == "GT" ){
                    $('.constrain-value-one', this.$el).removeClass("hidden");
                    $('.constrain-value-one', this.$el).show();

                    $('.constrain-value-two', this.$el).hide();
					$('.constrain-value-two', this.$el).val("");
					this.model.get("constrainParams").set("constrainValueOne", $('.constrain-value-one', this.$el).val());
					this.model.get("constrainParams").set("constrainValueTwo", "");
            }

		},
		updateConstrainFilterMenu : function() {

			var filterEl = $('.constrain-filter', this.$el);

			if(this.model.attributes.valueType ==="ANYRECORDOF"){
				console.log("Any Value Filter: " + this.model.attributes);
				filterEl.html('');
			}else if(this.model.attributes.concept.columnDataType==="CONTINUOUS"){
				filterEl.html(this.constrainFilterMenuTemplate(_.extend(this.model.attributes.constrainParams.attributes,this.model.attributes.concept)));
			}else if (this.model.attributes.concept.columnDataType==="VARIANT"){
				filterEl.html(this.constrainFilterMenuGeneticsTemplate(_.extend(this.model.attributes.constrainParams.attributes,this.model.attributes.concept)));
				filterEl.show();
			//don't need this extra condition any more; INFO are handled mostly the same way as categorical.
			// }else if (this.model.attributes.concept.columnDataType==="INFO"){
			// 	filterEl.html(this.constrainFilterMenuCategoriesTemplate(_.extend(this.model.attributes.constrainParams.attributes,this.model.attributes.concept)));
			}else {
				filterEl.html(this.constrainFilterMenuCategoriesTemplate(_.extend(this.model.attributes.constrainParams.attributes,this.model.attributes.concept)));
				//Move the selected items to the right box
				var selectedCategories = this.model.get("constrainParams").get("constrainValueOne"); 
				$(".available-categories > option").each(function() {
                    if(selectedCategories.includes(this.text)){
						$(".selected-categories", this.$el).append(this);
					}
                }); 
                //this should show the multi-select boxes.  the template should automatically have 'RESTRICT' by value selected.
               	this.updateCategoryFilterVisibility();
			}

			filterEl.show();
		},
		validateConstrainFilterFields : function () {
			var isValid = true;
			$('.constrain-value-one', this.$el).removeClass("field-invalid");
			$('.constrain-value-two', this.$el).removeClass("field-invalid");

			var constrainParams = this.model.get("constrainParams");

			if (constrainParams.get("constrainByValue") && this.model.attributes.concept.columnDataType==="CONTINUOUS"){
				var constrainValueOne = constrainParams.get("constrainValueOne").trim();
				var constrainValueTwo = constrainParams.get("constrainValueTwo").trim();

				if (constrainParams.get("valueOperator") == "LT" || constrainParams.get("valueOperator") == "GT") {
					if (constrainValueOne == "" || isNaN(constrainValueOne)
						|| !this.isValueInRange(constrainValueOne, this.model.attributes.concept.metadata.min, this.model.attributes.concept.metadata.max)) {
							$('.constrain-value-one', this.$el).addClass("field-invalid");
						isValid = false;
					}
				} else if (constrainParams.get("isValueOperatorBetween")) {
					if (constrainValueTwo == "" || isNaN(constrainValueTwo)
						|| !this.isValueInRange(constrainValueTwo, this.model.attributes.concept.metadata.min, this.model.attributes.concept.metadata.max)) {
						$('.constrain-value-two', this.$el).addClass("field-invalid");
						isValid = false;
					} else if (constrainValueOne == "" || isNaN(constrainValueOne)
						|| !this.isValueInRange(constrainValueOne, this.model.attributes.concept.metadata.min, this.model.attributes.concept.metadata.max)) {
						$('.constrain-value-one', this.$el).addClass("field-invalid");
						isValid = false;
					} else if (Number(constrainValueOne) > Number(constrainValueTwo)){
						$('.constrain-value-one', this.$el).addClass("field-invalid");
						$('.constrain-value-two', this.$el).addClass("field-invalid");
						isValid = false;
					}
				}
			}
			return isValid;
		},
		updateModel : function () {
			console.log(this.model.attributes.concept.columnDataType);
			//iterate over all selected elements and turn them into an array
			if(this.model.attributes.concept.columnDataType == "CATEGORICAL" || 
				this.model.attributes.concept.columnDataType == "INFO"){
				if($(".category-filter-restriction").val() == "RESTRICT"){
					var selectedCategories = [];
					$(".selected-categories > option").each(function() {
						selectedCategories.push(this.text);
					});

					this.model.get("constrainParams").set("constrainValueOne", selectedCategories);
				} else {
					this.model.get("constrainParams").set("constrainValueOne",[]);
				}
			}	

		},
		onConstrainApplyButtonClick : function (event) {

			this.updateModel();

			if (this.validateConstrainFilterFields()) {
				$('.validation-message', this.$el).text("");
				if(this.model.attributes.concept.columnDataType==="INFO"){
					//this.onConstrainVariantInfoSelect(event);
					//I don't think we need to call the above function anymore, but we still do need to set the valueType
					this.model.attributes.valueType="INFO";
					$('.search-value', this.$el).html("Variant Info Column " + this.model.get("category") + ': ' + this.model.get("constrainParams").get("constrainValueOne"));
						// (this.model.get("constrainParams").get("constrainValueOne")?this.model.get("constrainParams").get("constrainValueOne"):this.model.attributes.concept.metadata.min)
						// + " - "
						// + (this.model.get("constrainParams").get("constrainValueTwo")?this.model.get("constrainParams").get("constrainValueTwo"):this.model.attributes.concept.metadata.max));
				}else if(this.model.attributes.concept.columnDataType==="VARIANT"){
					this.model.get("constrainParams").set("constrainValueTwo", $(".value-constraint-genetics-btn", this.$el).text());
					$('.search-value', this.$el).html(this.model.get("constrainParams").get("constrainValueTwo") + " : " + this.model.get("searchTerm"));
				}else{
					if (this.model.get("constrainParams").get("constrainByValue")){
						var constrains = this.model.get("constrainParams");
						var searchParam = 
							(constrains.get("constrainValueOne")=="" && constrains.get("constrainValueTwo")=="") ? "Any value" :
						constrains.get("valueOperatorLabel")
						+ " "
						+ constrains.get("constrainValueOne")
						+ (constrains.get("isValueOperatorBetween") ? " - " : "")
						+ constrains.get("constrainValueTwo");
						$('.search-value', this.$el).html(this.model.get("searchValue") + ', ' + searchParam);
					}
				}
				this.$el.addClass("saved");
				$('.constrain-filter', this.$el).html("");
				this.onSelect(event);
			} else {
				$('.validation-message', this.$el).text("Value invalid! Correct invalid fields.");
			}
		},
		isValueInRange: function(value, min, max){
			if (value < min || value > max)
				return false;
			else
				return true;
		},
		geneticSelections: function(searchString){
			if(/\d+,\d+,.*,.*/.test(searchString)||(/\d+:\d+_.*/.test(searchString))){
				console.log(searchString);
				this.searchTerm(searchString);
			}
		},
		render: function(){
			this.$el.html(this.template(this.model.attributes));

			if(this.model.attributes.valueType ==="ANYRECORDOF"){
				$(".category-valueof-div", this.$el).html(this.constrainFilterMenuAnyRecordOfTemplate(this.model.attributes.anyRecordCategories));
			}

			var model = this.model;

			$('.dropdown-toggle', this.$el).dropdown();

			this.delegateEvents();
		}
	});
	return {
		View : filterView,
		Model : filterModel
	};
});

define(["handlebars","jquery","backbone", "underscore", "text!options/modal.hbs"],
	function(HBS,$,BB, _, modalTemplate){
		const TAB_INDEX_START = 1000000;
	let Modal = BB.View.extend({
		initialize: function(opts){
			this.title="";
			this.modalContainerId = "modal-window";
			HBS.registerHelper("tabindex", function(options) {
			  return TAB_INDEX_START + options;
			});
			this.createTabLoop();
		},
		events: {

		},
		render: function(view){
			let modalId = this.modalContainerId;

			if($("#" + modalId).length === 0) {
				$('#main-content').append('<div id="' + modalId + '" aria-modal="true"></div>');
			}

			if($(".modal-backdrop").length !== 0) {
				$(".modal-backdrop").remove();
			}

			let modal = $("#" + modalId);

			modal.html(HBS.compile(modalTemplate)({title: this.title}));

			$('#' + modalId + ' #modalDialog').on('click', function(event) {
				let parent = $(event.target).parent();
				// Traverse up the tree until we find the modal-content class or the body
				while (parent.length && !parent.is('body') && !parent.is('#modalDialog')) {
					parent = parent.parent();
				}

				// If we traversed up to the body, then we clicked outside the modal
				if (parent.is('body')) {
					$('#' + modalId + ' .close').click();
				}
			});


			$('#' + modalId + ' .close').click(function() {
				$("#" + modalId +  " #modalDialog").hide();
				$(".modal-backdrop").hide();
				view && this.destroyView(view);
            }.bind(this));
		},

		/*
			This function displays the Backbone.View passed in as the first argument. The
			second argument sets the title of the modal. The third is a callback which will
			be fired when the modal is dismissed. This dismissalAction enables chained modals
			where a modal can fire another modal and when that second modal is dismissed the
			prior modal can be displayed.
		*/
		displayModal: function(view, title, dismissalAction, opts){
			this.title = title;
			this.modalContainerId = (opts && opts.modalContainerId) ? opts.modalContainerId : "modal-window";
			this.render(view);

	        $('#' + this.modalContainerId + ' #modalDialog').modal({keyboard:true, backdrop: "static"});
			if(dismissalAction) {
				$('#' + this.modalContainerId + ' #modalDialog').on('hidden.bs.modal', dismissalAction);
			}

            $('#' + this.modalContainerId + ' .close').attr('tabindex', 1100000);
			view.setElement($('#' + this.modalContainerId +  ' .modal-body'));
			view.render();

			opts && opts.isHandleTabs && this.createTabIndex();
			opts && opts.width && $('#' + this.modalContainerId +  ' .modal-dialog').width(opts.width);
		},

		/*
			This function contains tab navigation to the modal to prevent focusing on
			elements that are behind the modal. This is a requirement of 
			https://www.w3.org/TR/wai-aria-practices-1.1/#dialog_modal
		*/
		createTabLoop: function() {
            document.addEventListener('keydown', function(e) {
                let isTabPressed = e.key === 'Tab' || e.keyCode === 9;

                if (!isTabPressed) {
                    return;
                }

                if (e.shiftKey) { // if shift key pressed for shift + tab combination
                    if ($(document.activeElement).is($('[tabindex="'+TAB_INDEX_START+'"]'))) {
                        $('[tabindex="1100000"]').focus(); // add focus for the last focusable element
                        e.preventDefault();
                    }
                } else { // if tab key is pressed
                    if ($(document.activeElement).is($('[tabindex="1100000"]'))) { // if focused has reached to last focusable element then focus first focusable element after pressing tab
                        $('[tabindex="'+TAB_INDEX_START+'"]').focus(); // add focus for the first focusable element
                        e.preventDefault();
                    }
                }
            });
        },

		destroyView: function(view){
			view.undelegateEvents();	
			$(view.el).removeData().unbind(); 
			view.remove();  
			Backbone.View.prototype.remove.call(view);
		},

		// Finds elements with a tab index or the class 'tabable' and sets the correct tab index for the modal. 
		// Ignores the close button.
		createTabIndex: function() {
			let tabIndex = TAB_INDEX_START;
			_.each($('#' + this.modalContainerId +  ' #modalDialog').find('[tabindex]:not(.close),.tabable'), function(el) {
				$(el).attr('tabindex', tabIndex);
				tabIndex++;
			});
		}
        
	});
	return new Modal;
});
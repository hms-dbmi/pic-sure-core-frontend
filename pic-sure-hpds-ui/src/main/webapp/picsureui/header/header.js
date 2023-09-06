define([
	"jquery", "backbone", "underscore", "handlebars", "text!header/header.hbs", "overrides/header",
	"picSure/settings", "common/pic-dropdown", "common/menu-nav-controls","common/keyboard-nav"
], function(
	$, BB, _, HBS, template, overrides, 
	settings, dropdown, menuNavControls, keyboardNav
){

    let headerTabs = undefined;
	/*
		Sets the navigable view and adds the selection class to the active tab.
	*/
	let tabsFocus = (e) => {
		console.debug("tabsFocus", e.target);
		keyboardNav.setCurrentView("headerTabs");
		dropdown.isOpen() ? e.target.querySelector('.header-btn.nav-dropdown').classList.add('selected') : headerTabs.querySelector('.header-btn.active').classList.add('selected');
	}
	/*
		If the tabs loose focus and the loss of focus is from something out side the #header-tabs div then
		we unset the navigable view. If a drodown is open it closes it. It also removes the selected class
		from any selected items.

		@param {e} The event that triggered the blur.
	*/
	let tabsBlur = (e) => {
		console.debug("tabsBlur", e);
		keyboardNav.setCurrentView(undefined);
		const selectedTab = headerTabs.querySelector('.header-btn.selected');
		selectedTab && selectedTab.classList.remove('selected');
		if (!e.relatedTarget) {
			dropdown.closeDropdown(e);
		}
	}

	var headerView = BB.View.extend({
		initialize : function(){
			if(settings.pageTitle){
				document.title = settings.pageTitle;
			}
            HBS.registerHelper('not_contains', function (array, object, opts) {
                var found = _.find(array, function (element) {
                    return (element === object);
                });
                if (found)
                    return opts.inverse(this);
                else
                    return opts.fn(this);
            });
            HBS.registerHelper('contains', function(list, element, options) {
                if(list != undefined && list.indexOf(element) > -1) {
                    return options.fn(this);
                }
                return options.inverse(this);
            });
            HBS.registerHelper('not_empty', function (array, opts) {
                if (array && array.length>0)
                    return opts.fn(this);
                else
                    return opts.inverse(this);
            });
            this.template = HBS.compile(template);
            this.applications = [];
            this.privileges = [];

            if (sessionStorage.getItem("session")) {
                var currentSession = JSON.parse(sessionStorage.getItem("session"));
                this.privileges = currentSession.privileges;
            }
            menuNavControls.init(this);
            this.on({
				'keynav-arrowup document': menuNavControls.upKeyPressed,
				'keynav-arrowdown document': menuNavControls.downKeyPressed,
				'keynav-arrowright document': menuNavControls.rightKeyPressed,
				'keynav-arrowleft document': menuNavControls.leftKeyPressed,
				'keynav-enter': menuNavControls.selectItem,
				'keynav-space': menuNavControls.selectItem,
				'keynav-escape': menuNavControls.escapeKeyPressed,
				'keynav-home': menuNavControls.homeKeyPressed,
				'keynav-end': menuNavControls.endKeyPressed,
				'keynav-letters': menuNavControls.letterKeyPressed,
			});
            if (!keyboardNav.navigableViews || !keyboardNav.navigableViews['headerTabs']) {
				keyboardNav.addNavigableView('headerTabs', this);
			}
		},
		events : {
			"click #logout-btn" : "gotoLogin",
            "click .header-navigation": "headerClick",
            "keypress #help-dropdown": "helpDropdownFocused"
		},
        helpDropdownFocused: function(event){
            if(event.keyCode===13){
                $("#help-dropdown-toggle").click();
                event.preventDefault();
            }
        },
        logout: function (event) {
        	//save redirection URL so we can log back in after logging out
        	redirection_url = sessionStorage.redirection_url;
            sessionStorage.clear();
            sessionStorage.redirection_url = redirection_url;
            localStorage.clear();
        },
        gotoLogin: function (event) {
            this.logout();
            window.location = "/psamaui/login" + window.location.search;
        },
        headerClick: function(event) {
		    if ($(event.target).data("href")) {
                window.history.pushState({}, "", $(event.target).data("href"));
            }
        },
		render : function(){
            dropdown.init(this, [
                {'click #super-admin-dropdown-toggle': dropdown.toggleDropdown},
				{'click #help-dropdown-toggle': dropdown.toggleDropdown}, 
				{'blur .nav-dropdown-menu': dropdown.dropdownBlur}
			]);
			this.$el.html(this.template({
				logoPath: (overrides.logoPath
					? overrides.logoPath : "/images/logo.png"),
				helpLink: settings.helpLink,
				pdfLink: settings.pdfLink,
				videoLink: settings.videoLink,
                jupyterExampleLink: settings.jupyterExampleLink,
                documentationLink: settings.documentationLink,
                privileges: this.privileges,
                applications: this.applications,
                authenticated: !!sessionStorage.getItem("session")
			}));
			headerTabs = this.el.querySelector('#header-tabs');
            headerTabs.addEventListener('focus', tabsFocus);
			headerTabs.addEventListener('blur', tabsBlur);

			if(overrides.renderExt){
				overrides.renderExt(this);
			}
		}
	});

	return {
		View : headerView
	};
});

define(["jquery", "backbone","handlebars", "text!header/header.hbs", "overrides/header", "picSure/settings",
        "common/transportErrors", "text!options/modal.hbs","text!header/userProfile.hbs",
        "util/notification", "psamaui/overrides/userProfile", "picSure/userFunctions"],
		function($, BB, HBS, template, overrides, settings,
                 transportErrors, modalTemplate, userProfileTemplate,
                 notification, profileOverride, userFunctions){
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
            HBS.registerHelper('partial_match', function(list, element, options) {
                if(list != undefined && list.filter(x => x.includes(element)).length > 0) {
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
            HBS.registerHelper('tokenExpiration', function (token) {
                var expirationTime = JSON.parse(atob(token.split('.')[1])).exp * 1000;
                var badgeClass = "primary";
                var badgeMessage = "unknown";
                var daysLeftOnToken = Math.floor((expirationTime - Date.now()) / (1000 * 60 * 60 * 24));
                if ( expirationTime < Date.now() ){
                    badgeClass = "danger";
                    badgeMessage = "EXPIRED"
                } else if ( daysLeftOnToken < 7 ) {
                    badgeClass = "danger";
                    badgeMessage = "EXPIRING SOON";
                } else {
                    badgeClass = "primary";
                    badgeMessage = "Valid for " + daysLeftOnToken + " more days";
                }
                return new Date(expirationTime).toString().substring(0,24) + " <span class='badge badge-" + badgeClass + "'>" + badgeMessage + "</span>";
            });
            this.template = HBS.compile(template);
            this.applications = [];
            this.modalTemplate = HBS.compile(modalTemplate);
            this.userProfileTemplate = HBS.compile(userProfileTemplate);
            this.privileges = [];

            if (sessionStorage.getItem("session")) {
                var currentSession = JSON.parse(sessionStorage.getItem("session"));
                this.privileges = currentSession.privileges;
            }
		},
		events : {
			"click #logout-btn" : "gotoLogin",
            "click #user-profile-btn": "userProfile",
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
        userProfile: function (event) {
        	if(profileOverride.userProfile) {
        		profileOverride.userProfile(event, this);
        	} else {
	            userFunctions.meWithToken(this, function(user){
	                if ($("#modal-window").length === 0) {
	                    $('#main-content').append('<div id="modal-window"></div>');
                    }
	                $("#modal-window").html(this.modalTemplate({title: "User Profile"}));
	                $("#modalDialog").modal({keyboard:true});
	                $(".modal-body").html(this.userProfileTemplate({user:user}));
	                $("#user-token-copy-button").click(this.copyToken);
	                $("#user-token-refresh-button").click(this.refreshToken);
	                $('#user-token-reveal-button').click(this.revealToken);
	                $('.close').click(this.closeDialog);
	                this.createTabLoop($('#close-modal-button'), $('#user_token_textarea'));
	            }.bind(this));
        	}
        },
        copyToken: function(){
            var originValue = document.getElementById("user_token_textarea").textContent;

            var sel = getSelection();
            var range = document.createRange();

            // this if for supporting chrome, since chrome will look for value instead of textContent
            // document.getElementById("user_token_textarea").value = document.getElementById("user_token_textarea").textContent;
            document.getElementById("user_token_textarea").value
                = document.getElementById("user_token_textarea").textContent
                = document.getElementById("user_token_textarea").attributes.token.value;
            range.selectNode(document.getElementById("user_token_textarea"));
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand("copy");

            $("#user-token-copy-button").html("Copied");

            document.getElementById("user_token_textarea").textContent
                = document.getElementById("user_token_textarea").value
                = originValue;
        },
        refreshToken: function(event){
		    $('#user-token-refresh-button').hide();
		    $('#user-token-refresh-confirm-container').show();
            $('#user-token-yes-button').focus();

            $('#user-token-no-button').click(function(e) {
                $('#user-token-refresh-confirm-container').hide();
                $('#user-token-refresh-button').show();
                $('#user-token-refresh-button').focus();
                e.preventDefault();
            });
		    $('#user-token-yes-button').click(function() {
                userFunctions.refreshUserLongTermToken(this, function(result){
                    if ($('#user-token-reveal-button').html() == "Hide"){
                        $("#user_token_textarea").html(result.userLongTermToken);
                    }

                    document.getElementById("user_token_textarea").attributes.token.value = result.userLongTermToken;

                    $("#user-token-copy-button").html("Copy");
                    $('#user-profile-btn').click()
                }.bind(this));
            });
		    event.preventDefault();
        },
        createTabLoop: function(firstFocusableElement, lastFocusableElement) {
            document.addEventListener('keydown', function(e) {
                let isTabPressed = e.key === 'Tab' || e.keyCode === 9;

                if (!isTabPressed) {
                    return;
                }

                if (e.shiftKey) { // if shift key pressed for shift + tab combination
                    if ($(document.activeElement).is(firstFocusableElement)) {
                        lastFocusableElement.focus(); // add focus for the last focusable element
                        e.preventDefault();
                    }
                } else { // if tab key is pressed
                    if ($(document.activeElement).is(lastFocusableElement)) { // if focused has reached to last focusable element then focus first focusable element after pressing tab
                        firstFocusableElement.focus(); // add focus for the first focusable element
                        e.preventDefault();
                    }
                }
            });
            firstFocusableElement.focus();
        },
        revealToken: function(event){
            var type = $('#user-token-reveal-button').html();
            if (type == "Reveal"){
                var token = $('#user_token_textarea')[0].attributes.token.value;
                $("#user_token_textarea").html(token);
                $("#user-token-reveal-button").html("Hide");
            } else {
                $("#user_token_textarea").html("**************************************************************************************************************************************************************************************************************************************************************************************");
                $("#user-token-reveal-button").html("Reveal");
            }
        },
        closeDialog: function () {
            $("#modalDialog").hide();
        },
        headerClick: function(event) {
		    if ($(event.target).data("href")) {
                window.history.pushState({}, "", $(event.target).data("href"));
            }
        },
		render : function(){
			this.$el.html(this.template({
				logoPath: (overrides.logoPath
					? overrides.logoPath : "/images/logo.png"),
				helpLink: settings.helpLink,
				pdfLink: settings.pdfLink,
				videoLink: settings.videoLink,
                jupyterExampleLink: settings.jupyterExampleLink,
                privileges: this.privileges,
                authenticated: !!sessionStorage.getItem("session")
			}));
		}
	});

	return {
		View : headerView
	};
});

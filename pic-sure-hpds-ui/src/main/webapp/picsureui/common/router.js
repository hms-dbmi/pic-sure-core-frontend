define([
    "backbone", "underscore", "common/session", "login/login", 'header/header', 'footer/footer',
    'psamaui/user/userProfile', 'user/userManagement',
    'role/roleManagement', 'privilege/privilegeManagement', "application/applicationManagement",
    'connection/connectionManagement', 'termsOfService/tos', "picSure/userFunctions",
    'handlebars', 'psamaui/accessRule/accessRuleManagement', 'overrides/router', "filter/filterList",
    "text!common/mainLayout.hbs", "picSure/queryBuilder", "output/outputPanel", "picSure/settings",
    "text!common/unexpected_error.hbs", "common/googleAnalytics", "header/bannerConfig", "header/banner"
], function (
    Backbone, _, session, login, header, footer,
    userProfile, userManagement,
    roleManagement, privilegeManagement, applicationManagement,
    connectionManagement, tos, userFunctions,
    HBS, accessRuleManagement, routerOverrides, filterList,
    layoutTemplate, queryBuilder, output, settings,
    unexpectedErrorTemplate, googleAnalytics, bannerConfig, BannerView
) {
    var publicRoutes = ["not_authorized", "login", "logout"];
    var Router = Backbone.Router.extend({
        routes: {
            "psamaui/userManagement(/)": "displayUserManagement",
            "psamaui/connectionManagement(/)": "displayConnectionManagement",
            "psamaui/tos(/)": "displayTOS",
            "psamaui/login(/)": "login",
            "psamaui/login(/)" : "login",
            "psamaui/logout(/)": "logout",
            "psamaui/not_authorized(/)": "not_authorized",
            "psamaui/roleManagement(/)": "displayRoleManagement",
            "psamaui/privilegeManagement(/)": "displayPrivilegeManagement",
            "psamaui/applicationManagement(/)": "displayApplicationManagement",
            "psamaui/accessRuleManagement(/)": "displayAccessRuleManagement",
            "picsureui/user(/)": "displayUserProfile",
            "picsureui/login(/)": "login",
            "picsureui/queryBuilder(/)": "displayQueryBuilder",
            "picsureui/not_authorized(/)": "not_authorized",
            "picsureui/unexpected_error(/)": "unexpected_error",
            // This path must be last in the list
            "*path": "defaultAction"
        },
        initialize: function () {
            for (const routeOverride in routerOverrides.routes) {
                this.route(routeOverride, routerOverrides.routes[routeOverride]);
            }
            var pushState = history.pushState;
            this.tos = tos;
            history.pushState = function (state, title, path) {
                if (state.trigger) {
                    this.router.navigate(path, state);
                } else {
                    this.router.navigate(path, {trigger: true});
                }
                return pushState.apply(history, arguments);
            }.bind({router: this});
            this.layoutTemplate = HBS.compile(layoutTemplate);
            this.unexpectedErrorTemplate = HBS.compile(unexpectedErrorTemplate);

                this.displayGoogleAnalytics();
            },
            execute: function (callback, args, name) {
                if (routerOverrides.execute) {
                    routerOverrides.execute.apply(this, [callback, args, name]);
                } else {
                if (publicRoutes.includes(name)) {
                    this.renderHeaderAndFooter();
                    callback.apply(this, args);
                } else {
                    let deferred = $.Deferred();
                    if (!session.isValid(deferred)) {
                        history.pushState({}, "", "/psamaui/logout");
                    }
                    $.when(deferred).then(function () {
                        this.renderHeaderAndFooter();
                        if (!(session.acceptedTOS() == true || session.acceptedTOS() == 'true') && name !== 'displayTOS') {
                            history.pushState({}, "", "/psamaui/tos");
                        } else if (callback) {
                            callback.apply(this, args);
                        }
                    }.bind(this));
                }
                }
        },
        login: function () {
            $(".header-btn.active").removeClass('active');
            login.showLoginPage();
        },
        logout: function () {
            $(".header-btn.active").removeClass('active');
            sessionStorage.clear();
            localStorage.clear();
            window.location = "/psamaui/login";
        },
        not_authorized: function () {
            $(".header-btn.active").removeClass('active');
            login.displayNotAuthorized();
        },
        unexpected_error: function () {
            $(".header-btn.active").removeClass('active');
            $('#main-content').empty();
            $('#main-content').html(this.unexpectedErrorTemplate(settings))
        },
        renderHeaderAndFooter: function () {
            var headerView = new header.View({});
            headerView.render();
            $('#header-content').html(headerView.$el);

            this.renderBanner();

                var footerView = new footer.View({});
                footerView.render();
                $('#footer-content').html(footerView.$el);
            },
        renderBanner: function () {
            // check if the file is present
            if (bannerConfig) {
                let bannerConfiguration = bannerConfig.bannerConfiguration;
                if (bannerConfiguration && bannerConfiguration.length > 0) {
                    let currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0); // Set the time part to 00:00:00 for accurate comparison

                    for (let i = 0; i < bannerConfiguration.length; i++) {
                        let config = bannerConfiguration[i];

                        // Manually parse the date string to avoid timezone conversion
                        let [year, month, day] = config.startDate.split("T")[0].split("-").map(Number);
                        let startDate = new Date(year, month - 1, day); // Months are 0-indexed in JavaScript

                        let [endYear, endMonth, endDay] = config.endDate.split("T")[0].split("-").map(Number);
                        let endDate = new Date(endYear, endMonth - 1, endDay);

                        // Check if the banner date is today's date and both text and color are present
                        if (currentDate.getTime() >= startDate.getTime() && currentDate.getTime() <= endDate.getTime() && config.styles && config.text && config.disabled !== true) {
                            // Instantiate and render the Banner View
                            let bannerView = new BannerView({
                                bannerStyles: config.styles,
                                bannerText: config.text,
                                isDismissible: config.isDismissible
                            });

                            let banner = bannerView.render();
                            // Render the banner at the top of the page.
                            $('#header').prepend(banner.$el);
                            break; // Stop the loop once a matching banner is found and displayed
                        }
                    }
                }
            }
        },
            displayUserManagement: function () {
                $(".header-btn.active").removeClass('active');
                $(".header-btn[data-href='/psamaui/userManagement']").addClass('active');
                $('#main-content').empty();
                userFunctions.me(this, function (data) {
                    var userMngmt = new userManagement.View({model: new userManagement.Model()});
                    userMngmt.render();
                    $('#main-content').html(userMngmt.$el);
                });
            },
            displayTOS: function () {
                $(".header-btn.active").removeClass('active');
                $('#main-content').empty();
                var termsOfService = new this.tos.View({model: new this.tos.Model()});
                termsOfService.render();
                $('#main-content').html(termsOfService.$el);

        },
        displayApplicationManagement: function () {
            $(".header-btn.active").removeClass('active');
            $('#super-admin-dropdown-toggle').addClass('active');
            $('#main-content').empty();
            userFunctions.me(this, function (data) {
                if (_.find(data.privileges, function (element) {
                    return (element === 'SUPER_ADMIN')
                })) {
                    var appliMngmt = new applicationManagement.View({model: new applicationManagement.Model()});
                    appliMngmt.render();
                    $('#main-content').append(appliMngmt.$el);
                } else {
                    window.history.pushState({}, "", "/psamaui/not_authorized");
                }
            });

        },
        displayRoleManagement: function () {
            $(".header-btn.active").removeClass('active');
            $('#super-admin-dropdown-toggle').addClass('active');
            $('#main-content').empty();
            userFunctions.me(this, function (data) {
                if (_.find(data.privileges, function (element) {
                    return (element === 'SUPER_ADMIN')
                })) {
                    var roleMngmt = new roleManagement.View({model: new roleManagement.Model()});
                    roleMngmt.render();
                    $('#main-content').append(roleMngmt.$el);
                } else {
                    window.history.pushState({}, "", "/psamaui/not_authorized");
                }
            });

        },
        displayPrivilegeManagement: function () {
            $(".header-btn.active").removeClass('active');
            $('#super-admin-dropdown-toggle').addClass('active');
            $('#main-content').empty();
            userFunctions.me(this, function (data) {
                if (_.find(data.privileges, function (element) {
                    return (element === 'SUPER_ADMIN')
                })) {
                    var privMngmt = new privilegeManagement.View({model: new privilegeManagement.Model()});
                    privMngmt.render();
                    $('#main-content').append(privMngmt.$el);
                } else {
                    window.history.pushState({}, "", "/psamaui/not_authorized");
                }
            });
        },
        displayAccessRuleManagement: function () {
            $(".header-btn.active").removeClass('active');
            $('#super-admin-dropdown-toggle').addClass('active');
            $('#main-content').empty();
            userFunctions.me(this, function (data) {
                if (_.find(data.accessRules, function (element) {
                    return (element === 'ROLE_SUPER_ADMIN')
                })) {
                    var accRuleMngmt = new accessRuleManagement.View({model: new accessRuleManagement.Model()});
                    accRuleMngmt.render();
                    $('#main-content').append(accRuleMngmt.$el);
                } else {
                    window.history.pushState({}, "", "/psamaui/not_authorized");
                }
            });
        },
        displayConnectionManagement: function () {
            $(".header-btn.active").removeClass('active');
            $('#super-admin-dropdown-toggle').addClass('active');
            $('#main-content').empty();
            userFunctions.me(this, function (data) {
                if (_.find(data.privileges, function (element) {
                    return (element === 'SUPER_ADMIN')
                })) {
                    var connectionMngmt = new connectionManagement.View({model: new connectionManagement.Model()});
                    connectionMngmt.render();
                    $('#main-content').append(connectionMngmt.$el);
                } else {
                    window.history.pushState({}, "", "/psamaui/not_authorized");
                }
            });

        },
        displayQueryBuilder: function () {
            $(".header-btn.active").removeClass('active');
            $(".header-btn[data-href='/picsureui/queryBuilder']").addClass('active');

            $('#main-content').empty();
            $('#main-content').append(this.layoutTemplate(settings));

            var outputPanelView = new output.View({model: new output.Model()});
            outputPanelView.render();
            $('#query-results').append(outputPanelView.$el);

            var parsedSess = JSON.parse(sessionStorage.getItem("session"));

            var query = queryBuilder.generateQuery({}, JSON.parse(parsedSess.queryTemplate), settings.picSureResourceId);
            outputPanelView.runQuery(query);

            filterList.init(settings.picSureResourceId, outputPanelView, JSON.parse(parsedSess.queryTemplate));
        },
        displayGoogleAnalytics: function () {
            let analyticsView = new googleAnalytics.View({analyticsId: settings.analyticsId});
            // append the analytics view to the body
            analyticsView.render();
            $("head").append(analyticsView.$el);
        },
        displayUserProfile: function () {
            $(".header-btn.active").removeClass('active');
            $(".header-btn[href='/picsureui/user']").addClass('active');

            $('#main-content').empty();
            userFunctions.meWithToken(this, (user) => {
                const profile = new userProfile(user);
                $('#main-content').append(profile.$el);
                profile.render();
            });
        },
            defaultAction: function () {
                console.log("Default action");
                $(".header-btn.active").removeClass('active');
                if (routerOverrides.defaultAction)
                    routerOverrides.defaultAction();
                else {
                    this.displayQueryBuilder();
                }
            }
        });
        return new Router();
    });

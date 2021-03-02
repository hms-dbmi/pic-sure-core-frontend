define(["backbone", "common/session", "login/login", 'header/header', 'footer/footer','user/userManagement',
        'role/roleManagement', 'privilege/privilegeManagement', "application/applicationManagement",
        'connection/connectionManagement', 'termsOfService/tos', "picSure/userFunctions",
        'handlebars', 'psamaui/accessRule/accessRuleManagement', 'overrides/router', "filter/filterList",
        "text!common/mainLayout.hbs", "picSure/queryBuilder", "output/outputPanel", "text!../settings/settings.json",
        "picSure/ontology", "text!filter/searchHelpTooltip.hbs"],
        function(Backbone, session, login, header, footer, userManagement,
                roleManagement, privilegeManagement, applicationManagement,
                connectionManagement, tos, userFunctions,
                HBS, accessRuleManagement, routerOverrides, filterList,
                 layoutTemplate, queryBuilder, output, settings,
                 ontology, searchHelpTooltipTemplate){
        var Router = Backbone.Router.extend({
        routes: {
            "psamaui/userManagement(/)" : "displayUserManagement",
            "psamaui/connectionManagement(/)" : "displayConnectionManagement",
            "psamaui/tos(/)" : "displayTOS",
            "psamaui/login(/)" : "login",
            "psamaui/logout(/)" : "logout",
            "psamaui/not_authorized(/)" : "not_authorized",
            "psamaui/roleManagement(/)" : "displayRoleManagement",
            "psamaui/privilegeManagement(/)" : "displayPrivilegeManagement",
            "psamaui/applicationManagement(/)" : "displayApplicationManagement",
            "psamaui/accessRuleManagement(/)" : "displayAccessRuleManagement",
            "picsureui/queryBuilder" : "displayQueryBuilder",
            "picsureui/" : "displayQueryBuilder",
            "picsureui/not_authorized(/)" : "not_authorized",

            // This path must be last in the list
            "*path" : "displayQueryBuilder"
        },
        initialize: function(){
            for (const routeOverride in routerOverrides.routes) {
                this.route(routeOverride, routerOverrides.routes[routeOverride]);
            }
            var pushState = history.pushState;
            //TODO: Why
            this.tos = tos;
            history.pushState = function(state, title, path) {
                if(state.trigger){
                    this.router.navigate(path, state);
                }else{
                    this.router.navigate(path, {trigger: true});
                }
                return pushState.apply(history, arguments);
            }.bind({router:this});
        },
       execute: function(callback, args, name){
            if ( name === 'not_authorized' ){
                callback.apply(this, args);
            } else {
                if ( ! session.isValid(login.handleNotAuthorizedResponse)){
                    this.login();
                    this.renderHeaderAndFooter();
                    return false;
                }
                if (!session.acceptedTOS() && name !== 'displayTOS'){
                    history.pushState({}, "", "/psamaui/tos");
                }
                else if (callback) {
                    callback.apply(this, args);
                }
            }
            this.renderHeaderAndFooter();
        },
        login : function(){
            login.showLoginPage();
        },
        logout : function(){
            sessionStorage.clear();
            localStorage.clear();
            window.location = "/psamaui/logout";
        },
        not_authorized : function(){
            login.displayNotAuthorized();
        },
        renderHeaderAndFooter: function(){
            if ($('#header-content').is(':empty')) {
                var headerView = header.View;
                headerView.render();
                $('#header-content').html(headerView.$el);
            }

            if ($('#footer-content').is(':empty')) {
                var footerView = footer.View;
                footerView.render();
                $('#footer-content').html(footerView.$el);
            }
        },
        displayUserManagement : function(){
            $('#main-content').empty();
            userFunctions.me(this, function(data){
                    var userMngmt = new userManagement.View({model: new userManagement.Model()});
                    userMngmt.render();
                    $('#main-content').html(userMngmt.$el);
            });
        },
        displayTOS : function() {
            $('#main-content').empty();
            var termsOfService = new this.tos.View({model: new this.tos.Model()});
            termsOfService.render();
            $('#main-content').html(termsOfService.$el);

        },
        displayApplicationManagement : function(){
            $('#main-content').empty();
            userFunctions.me(this, function(data){
                if (_.find(data.privileges, function(element){
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
        displayRoleManagement : function(){
            $('#main-content').empty();
            userFunctions.me(this, function(data){
                if (_.find(data.privileges, function(element){
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
        displayPrivilegeManagement : function() {
            $('#main-content').empty();
            userFunctions.me(this, function(data){
                if (_.find(data.privileges, function(element){
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
        displayAccessRuleManagement : function() {
            $('#main-content').empty();
            userFunctions.me(this, function(data){
                if (_.find(data.accessRules, function(element){
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
        displayConnectionManagement : function() {
            $('#main-content').empty();
            userFunctions.me(this, function(data){
                if (_.find(data.privileges, function(element){
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
        displayQueryBuilder: function() {
            $('#main-content').empty();
            let parsedSettings = JSON.parse(settings);
            $('#main-content').append(HBS.compile(layoutTemplate)(parsedSettings));
            // todo: move this somewhere else
            var renderHelpCallback = function(filterView) {
                ontology.getInstance().allInfoColumnsLoaded.then(function(){
                    $('.show-help-modal').click(function() {
                        $('#modal-window').html(HBS.compile(searchHelpTooltipTemplate)(ontology.getInstance().allInfoColumns()));
                        $('#modal-window', this.$el).tooltip();
                        $(".close").click(function(){
                            $("#search-help-modal").hide();
                        });
                        $("#search-help-modal").show();
                    });
                }.bind(filterView));
            }
            filterList.init(parsedSettings.picSureResourceId, renderHelpCallback);
            var outputPanel = output.View;
            outputPanel.render();
            $('#query-results').append(outputPanel.$el);

            var query = queryBuilder.createQuery({}, parsedSettings.picSureResourceId);
            outputPanel.update(query);
        }


    });
    return new Router();
});

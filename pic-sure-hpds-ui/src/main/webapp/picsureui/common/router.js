define(["common/searchParser", "backbone", "common/session", "login/login", 'header/header', 'footer/footer','user/userManagement',
        'role/roleManagement', 'privilege/privilegeManagement', "application/applicationManagement",
        'connection/connectionManagement', 'termsOfService/tos', "picSure/userFunctions",
        'handlebars', 'psamaui/accessRule/accessRuleManagement', 'common/startup', 'overrides/router'],
        function(searchParser, Backbone, session, login, header, footer, userManagement,
                roleManagement, privilegeManagement, applicationManagement,
                connectionManagement, tos, userFunctions,
                HBS, accessRuleManagement, startup, routerOverrides){
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
                if (!(session.acceptedTOS() == true || session.acceptedTOS() == 'true') && name !== 'displayTOS'){
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
                    $('#main-content').html(HBS.compile(notAuthorizedTemplate)({}));
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
                    $('#main-content').html(HBS.compile(notAuthorizedTemplate)({}));
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
                    $('#main-content').html(HBS.compile(notAuthorizedTemplate)({}));
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
                    $('#main-content').html(HBS.compile(notAuthorizedTemplate)({}));
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
                    $('#main-content').html(HBS.compile(notAuthorizedTemplate)({}));
                }
            });

        },
        displayQueryBuilder: function() {
            $('#main-content').empty();
            startup();
        }


    });
    return new Router();
});

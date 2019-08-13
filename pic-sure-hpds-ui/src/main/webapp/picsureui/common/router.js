define(["text!settings/settings.json","common/searchParser", "header/header", "backbone", "auth/login", "common/queryBuilderView"],
        function(settings, searchParser, header, Backbone, login, queryBuilderView){
    var Router = Backbone.Router.extend({
        routes: {
            "queryBuilder" : "displayQueryBuilder",
            "login(/)" : "login",
            "logout(/)" : "logout",
            "not_authorized(/)" : "not_authorized",

            // This path must be last in the list
            "*path" : "displayQueryBuilder"
        },

        initialize: function(){
            var pushState = history.pushState;
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
            if( ! session.isValid()){
                this.login();
                return false;
            }
            if (callback) {
                    callback.apply(this, args);
            }
        },

        login : function(){
            topNav.clear();
            login.showLoginPage();
        },

        logout : function(){
            topNav.clear();
            sessionStorage.clear();
            window.location = "/logout";
        },

        not_authorized : function(){
        		sessionStorage.clear();
        		$('body').html("Sorry you are not authorized to access this system at this time.");
        },

        displayQueryBuilder : function(){
            queryBuilderView();
        }
    });
    return new Router();
});

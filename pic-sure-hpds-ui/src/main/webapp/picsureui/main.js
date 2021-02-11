require.config({
	baseUrl: "/picsureui",
	paths: {
		jquery: 'webjars/jquery/3.5.1/dist/jquery.min',
		autocomplete: 'webjars/devbridge-autocomplete/1.4.7/dist/jquery.autocomplete',
		underscore: 'webjars/underscorejs/1.8.3/underscore-min',
		bootstrap: 'webjars/bootstrap/3.4.1/js/bootstrap.min',
		bootstrapStyles: 'webjars/bootstrap/3.4.1/css/bootstrap.min.css',
		backbone: 'webjars/backbonejs/1.3.3/backbone-min',
		text: 'webjars/requirejs-text/2.0.15/text',
		handlebars: 'webjars/handlebars/4.7.6/handlebars.min',
		treeview: 'webjars/bootstrap-treeview/1.2.0/bootstrap-treeview.min',
		treeviewStyles: 'webjars/bootstrap-treeview/1.2.0/bootstrap-treeview.min.css',
		Noty: 'webjars/noty/3.1.4/lib/noty',
		NotyStyles: 'webjars/noty/3.1.4/lib/noty.css',
		"jstree":"webjars/jstree/3.3.7/jstree",
		accessRule: "psamaui/accessRule/",
		application: "psamaui/application/",
		connection: "psamaui/connection/",
		login: "psamaui/login/",
		privilege: "psamaui/privilege/",
		picSure: "picSure/",
		psamaSettings: "psamaui/settings/",
		role: "psamaui/role/",
		termsOfService: "psamaui/termsOfService/",
        user: "psamaui/user/",
        util: "psamaui/util/",
	},
	shim: {
		"bootstrap": {
			deps: ["jquery"]
		},
		"treeview": {
			deps:["bootstrap"]
		},
		"common/startup":{
			deps:["overrides/main"]
		},
		"jstree": {
			deps: ["jquery"]
		}
	}
});

require(["backbone", "common/session", "common/router", "underscore", "jquery", "bootstrap"],
    function(Backbone, session, router, _){
        Backbone.history.start({pushState:true});
        document.onmousemove = session.activity;
        document.onkeyup = session.activity;
    }
);
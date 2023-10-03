define([
    "jquery", "backbone", "handlebars", "text!psamaui/user/userProfile.hbs", "psamaui/overrides/userProfile",
    "psamaui/user/userToken", "dataset/dataset-manage"
], function(
    $, BB, HBS, template, overrides,
    userToken, datasetManagement
){
    return BB.View.extend({
        initialize : function(user){
            this.user = user;
        },
        displayUserTokenBox: function(){
            if (overrides && overrides.displayUserTokenBox) {
                overrides.displayUserTokenBox(this);
                return;
            }

            const token = new userToken(this.user);
            $('#user-token-box').append(token.$el);
            token.render();
        },
        displayDatasetManagementBox: function(){
            if (overrides && overrides.displayDatasetManagementBox) {
                overrides.displayDatasetManagementBox(this);
                return;
            }

            const management = new datasetManagement(this.user);
            $('#dataset-management-box').append(management.$el);
            management.render();
        },
        render: function(){
            this.$el.html(HBS.compile(template)(this));

            this.displayUserTokenBox();
            this.displayDatasetManagementBox();

            overrides.renderOverride && overrides.renderOverride(this);
        }
    });
});
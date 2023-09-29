// This is used to pull configuration from headerConfig.json
define(["text!settings/banner_config.json"], function(settings){
    return JSON.parse(settings);
});
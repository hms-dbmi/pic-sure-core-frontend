// This is used to pull configuration from headerConfig.json
define(["text!settings/bannerConfig.json"], function(settings){
    return JSON.parse(settings);
});
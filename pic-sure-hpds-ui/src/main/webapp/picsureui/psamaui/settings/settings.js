// This will pull settings from JSON and parse it to use in subsequent API calls.
define(["text!psamaSettings/settings.json"], function(settings){
    return JSON.parse(settings);
});
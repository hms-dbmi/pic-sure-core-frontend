// This is used to pull configuration from headerConfig.json
define(["text!settings/banner_config.json"], function (settings) {
    // verify that the settings file exists
    if (!settings) {
        return undefined;
    }

    try {
        return JSON.parse(settings);
    } catch (e) {
        console.error("Error parsing banner_config.json", e);
        return undefined;
    }
});
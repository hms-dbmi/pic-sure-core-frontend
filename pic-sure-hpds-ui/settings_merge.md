Merging PIC-SURE and PSAMA settings
-------------------

A recent (September 2021) configuration change has merged the previously separate files that contain the PIC-SURE settings and the settings for the Pic-Sure Auth Micro-App (PSAMA).  

The changes required for this update are minimal.  Three settings from the PSAMA settings file need to be copied into the Pic-Sure settings file, and the process is finished.  For installations using the Pic-Sure All-In-One template, the PSAMA settings file is located at /usr/local/docker-config/httpd/psamaui\_settings.json, and the Pic-Sure settings file is /usr/local/docker-config/httpd/picsureui\_settings.json

The following settings need to me added to the picsure settings file (show here with default values).  All other settings in the psama settings file have been deprecated or are already duplicated in the picsure settings.

 * "customizeAuth0Login":true,

 * "client\_id":"AUTH0\_CLIENT\_ID",

 * "auth0domain":"AUTH0\_DOMAIN"
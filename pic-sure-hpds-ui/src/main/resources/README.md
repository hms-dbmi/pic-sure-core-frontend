For each PIC-SURE environment that you want the application to talk to, there should
be an entry in the resources array in settings.json. 

Each entry has 4 key-value pairs:

id: an id that should be a valid variable name in JavaScript, also you should avoid
any special characters here as a general rule

name: a human readable name used to generate labels and such in the UI

basePath: the base path of the PIC-SURE instance, unless using CORS
this path should be proxied to the actual instance in the httpd-vhost.conf

basePui: This is the base path within the resource which is used for all queries. Ideally this base path exists in all entries in the resources list.


The first entry in the resources array is the one that will be used for autocomplete.



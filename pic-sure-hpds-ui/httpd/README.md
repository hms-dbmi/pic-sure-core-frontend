This is the build context for the httpd image that is used to host the app
in development. 

You can add additional(or change existing) PIC-SURE instances to the proxy
by adding one line in httpd-vhosts.conf per proxy.

Currently things are configured to point to grin-docker-dev through the
existing proxy on that server. 

If you add a new proxy line here, you still need to edit the settings.json
file in src/main/resources, see the README.md in that folder for further info.

Editing the httpd-vhosts.conf file in any way requires you to rebuild the image.

docker-compose down && docker-compose build && docker-compose up -d



PIC-SURE API UI Extension
=========================


Note: This project is heavily modified from the original IRCT based PIC-SURE UI to support HPDS.


The archetype that generated this project allows you to customize common
functionality and styling of the PIC-SURE UI project.

The PIC-SURE UI base project can be seen here:

https://github.com/hms-dbmi/pic-sure-ui

To run your local development environment you will need the following:

Maven 3+
A recent Docker installation including docker-compose

Running in Dev Mode
-------------------

mvn clean install       # this retrieves dependencies
docker-compose up -d    # this starts an apache httpd server that hosts the app

You can then point your browser at your docker node. You might be using
docker-machine, you might not this is dependent on your environment. 

Once the app is running, you can edit the files in src/main/javascript
and src/main/resources and just refresh your browser to see the changes.


Minor Changes
-------------

If you just want to change the color scheme or how counts are displayed
or anything really common like that, you can probably just edit the files
in src/main/javascript/overrides. Each of these files has some comments
about how to edit them properly at the top.


Major Changes
-------------

If you want to completely override something or the standard overrides
don't account for your use-case, you can override entire modules by editing
src/main/javascript/overrides/main.js to override the path of a module
to point to your overridden version. Keep in mind this means you should
be implementing everything in the API exposed by the original module.


What Next
---------

If your changes are applicable to the general use-cases for PIC-SURE UI
we might want to integrate them into the base project. Also, if you believe
we could better serve the community by adding more default extension points
please let us know at: avillach-lab-developers@googlegroups.com



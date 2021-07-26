FROM httpd:2.4.46-alpine

RUN apk add --update openssl sed

# Replace virtual host config file with ours
COPY httpd/httpd-vhosts.conf ${HTTPD_PREFIX}/conf/extra/httpd-vhosts.conf

# Enable virtual hosting config file
RUN sed -i '/^#Include conf.extra.httpd-vhosts.conf/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf

# Enable necessary proxy modules
RUN sed -i '/^#LoadModule proxy_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i  '/^#LoadModule proxy_http_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule proxy_connect_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf

#### SSL ####
# enable ssl
RUN sed -i '/^#LoadModule ssl_module modules\/mod_ssl.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule rewrite_module modules\/mod_rewrite.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule socache_shmcb_module modules\/mod_socache_shmcb.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN mkdir /usr/local/apache2/logs/ssl_mutex

RUN sed -i 's/\.\.\/images\//\/picsureui\/webjars\/datatables\/1\.10\.25\/images\//g' ${HTTPD_PREFIX}/htdocs/picsureui/webjars/datatables/1.10.25/css/jquery.dataTables.min.css

COPY target/webjars/META-INF/resources/webjars /usr/local/apache2/htdocs/picsureui/webjars
COPY src/main/webapp/picsureui /usr/local/apache2/htdocs/picsureui
COPY src/main/resources /usr/local/apache2/htdocs/picsureui/settings

FROM httpd:2.4.54-alpine

RUN apk add --update openssl sed

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

# Disable directory browsing
RUN sed -i 's/Options Indexes FollowSymLinks/Options FollowSymLinks/' ${HTTPD_PREFIX}/conf/httpd.conf

COPY target/webjars/META-INF/resources/webjars /usr/local/apache2/htdocs/picsureui/webjars
RUN sed -i 's/\.\.\/images\//\/picsureui\/webjars\/datatables\/1\.13\.5\/images\//g' ${HTTPD_PREFIX}/htdocs/picsureui/webjars/datatables/1.13.5/css/jquery.dataTables.min.css

COPY src/main/webapp/picsureui /usr/local/apache2/htdocs/picsureui
COPY src/main/resources /usr/local/apache2/htdocs/picsureui/settings
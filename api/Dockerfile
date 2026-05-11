FROM php:8.2-apache

RUN docker-php-ext-install pdo_mysql \
    && a2enmod headers rewrite

WORKDIR /var/www/html

COPY api/ /var/www/html/api/
COPY uploads/ /var/www/html/uploads/

RUN chown -R www-data:www-data /var/www/html/uploads

EXPOSE 80

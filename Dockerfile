FROM adoptopenjdk:11-jre-hotspot

ADD backend/build/libs/money-printers-0.0.1-SNAPSHOT.jar money-printers.jar
ADD frontend/dist/money-printers public

ENTRYPOINT exec java -jar money-printers.jar
# rata-client
Client program for rata.digitraffic.fi.
Stores trains and compositions into PostgreSQL database. Requires TimescaleDB extension.

Usage

node rata-client.js

listens updates over MQTT


node rata-client.js fileName

imports trains or compositions JSON dump from fileName

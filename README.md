# rata-client
Client program for rata.digitraffic.fi.
Stores trains and compositions into PostgreSQL database.

Usage

node rata-client.js <fileName>
  imports JSON from fileName if passed
  otherwise listens live-trains on MQTT connection
  

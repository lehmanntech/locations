#!/bin/bash
docker run -d --link locations-mongo:mongo -p 10000:8080 lehmanntech/locations:latest

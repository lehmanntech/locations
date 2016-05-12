FROM node:argon

ENV app_port 8080
ENV base /usr/src/app

RUN mkdir -p $base
WORKDIR $base

ADD . $base
RUN npm install --production

EXPOSE $app_port
CMD ["npm", "start"]

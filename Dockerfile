FROM node:argon

ENV app_port 8080
ENV base /usr/src/app

RUN mkdir -p $base
WORKDIR $base

COPY package.json $base
RUN npm install

COPY . $base

EXPOSE $app_port
CMD ["npm", "start"]

FROM node:25-alpine
LABEL authors="Emma Beurskens"

EXPOSE 8080
ADD ./ /home/node/app
WORKDIR /home/node/app
RUN ["npm", "install"]
ENTRYPOINT ["node", "index.js"]
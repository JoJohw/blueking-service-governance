# The Dockerfile that builds the test runner environment
FROM node:24.7.0-alpine3.21

RUN npm install -g @usebruno/cli@3.0.2

WORKDIR /app

ADD start.sh /app/bin/

CMD ["sh", "/app/bin/start.sh"]

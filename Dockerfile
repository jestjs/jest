#Build: docker build -t jest .
#Run: docker run --volume="$PWD:/usr/src/app" --rm jest:latest

FROM node:lts

#Setup basic environment
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    LC_ALL=C.UTF-8 \
    LANGUAGE=en_US.UTF-8

WORKDIR /usr/src/app

#Copy entire directory
COPY . ./

#Install dependencies
RUN yarn install

#Build && Watch for changes
ENTRYPOINT ["yarn"]
CMD ["watch:polling"]

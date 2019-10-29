#Build: docker build -t jest .
#Run: docker run --volume="$PWD:/usr/src/app" --rm jest:latest

#Use Python 2.7.17 image
FROM python:2.7.17

#Setup basic environment
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    LC_ALL=C.UTF-8 \
    LANGUAGE=en_US.UTF-8

WORKDIR /usr/src/app

#Install NodeJS 12.x && npm
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt -y install nodejs

#Install yarn
RUN npm install -g yarn

#Copy entire directory
COPY . ./

#Install dependencies
RUN yarn

#Build && Watch for changes
ENTRYPOINT ["yarn"]
CMD ["watch"]

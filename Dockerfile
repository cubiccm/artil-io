ARG VARIANT="16-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

# Prepare

RUN sed -i "s@http://.*deb.debian.org@https://mirrors.nju.edu.cn@g" /etc/apt/sources.list
RUN sed -i "s@http://.*security.debian.org@https://mirrors.nju.edu.cn@g" /etc/apt/sources.list

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install curl libsdl-pango-dev

RUN npm config set registry http://mirrors.cloud.tencent.com/npm/

# Install game 

COPY . /root/app
WORKDIR /root/app

RUN yarn config set registry https://registry.npm.taobao.org/
RUN yarn install

EXPOSE 4000

CMD ["/bin/bash", "/root/app/start.sh"]
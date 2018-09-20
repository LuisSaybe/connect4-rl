FROM centos:7

ENV SOURCE_DIRECTORY /root/connect4-rl

ADD init.sh /init.sh
ADD nginx.conf /root/nginx.conf

RUN \
    printf "[nginx]\nname=nginx repo\nbaseurl=http://nginx.org/packages/centos/7/x86_64/\ngpgcheck=0\nenabled=1" >> /etc/yum.repos.d/nginx.repo && \
    yum -y update && \
    yum install -y wget nginx-1.14.0 git-all curl nano which man manpages && \

    curl --silent --location https://rpm.nodesource.com/setup_8.x | bash - && \
    yum -y install nodejs && \
    chmod +x /init.sh && \
    mkdir ~/.ssh

CMD /init.sh

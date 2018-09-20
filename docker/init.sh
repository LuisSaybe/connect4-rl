#!/bin/bash

if [ ! -d $SOURCE_DIRECTORY ]; then
  if [ -z $BRANCH ]; then
    BRANCH="master"
  fi

  git clone -b $BRANCH --single-branch https://github.com/LuisSaybe/connect4-rl.git $SOURCE_DIRECTORY
  cd $SOURCE_DIRECTORY

  if [ ! -z $COMMIT ]; then
      git reset --hard $COMMIT
  fi

  cd $SOURCE_DIRECTORY
  yarn
  npm run build
  nginx -c /root/nginx.conf
elif [ -z $WATCH ]; then
  nginx -c /root/nginx.conf -g 'daemon off;'
else
  cd $SOURCE_DIRECTORY
  rm -rf node_modules
  yarn
  nginx -c /root/nginx.conf
  npm run watch
fi

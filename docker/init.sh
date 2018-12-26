#!/bin/bash

if [ ! -d $SOURCE_DIRECTORY ]; then
  if [ -z $BRANCH ]; then
    BRANCH="master"
  fi

  git clone -b $BRANCH --single-branch https://github.com/LuisSaybe/connect4-rl.git $SOURCE_DIRECTORY
  cd $SOURCE_DIRECTORY

  if [ -n "$SETTINGS" ]; then
    echo $SETTINGS > $SOURCE_DIRECTORY/src/js/settings.json
  fi

  if [ ! -z $COMMIT ]; then
      git reset --hard $COMMIT
  fi

  cd $SOURCE_DIRECTORY
  yarn
  npm run build
  nginx -c /root/nginx.conf
  node server.js
else
  if [ -n "$SETTINGS" ]; then
    echo $SETTINGS > $SOURCE_DIRECTORY/src/js/settings.json
  fi

  cd $SOURCE_DIRECTORY
  nginx -c /root/nginx.conf
  node server.js
fi

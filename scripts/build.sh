#!/usr/bin/env bash

cd frontend/
npm run build
cd ../
sudo docker build . -t kapitalbestand

# HarmoVIS_client
Harmoware-VIS client for Synerex using Electron


#How to build
yarn
yarn build


#How to make distribution package

You have to copy your own synerex-server, harmovis-layers, nodeserv into synerex directory
mkdir synerex
cp [youbindir]harmovis-layers synerex
yarn dist-mac

yarn dist-win

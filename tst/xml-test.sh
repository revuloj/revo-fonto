#!/bin/bash

# tuj finu se unuopa komando fiaskas 
# - necesas por distingi sukcesan de malsukcesa testaro
set -e

echo "Ni testas la sintakson de agordodosieroj. Necesas instalita programo rxp."

echo "cfg/bibliogr.xml"
rxp -Vs cfg/bibliogr.xml

echo "cfg/enhavo.xml"
rxp -Vs cfg/enhavo.xml

echo "cfg/klasoj.xml"
rxp -s cfg/klasoj.xml

echo "cfg/vikiref_esc.xml"
rxp -s cfg/vikiref_esc.xml


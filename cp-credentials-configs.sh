#!/bin/bash

for file in `find ./configs -iname _credentials.json -type f`; do
    cp $file `echo $file | sed -e s/_//g`
done

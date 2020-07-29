#!/bin/bash
d="2020-07-01"
until [[ $d > 2020-12-11 ]]; do 
    echo "${d}"
	file="${d}_trains.json"
	url="https://rata.digitraffic.fi/api/v1/trains/${d}"
	curl -o ${file} --compressed ${url}
	node ../rata-client.js -t ${file}
    d=$(date -I -d "${d} + 1 day")
done

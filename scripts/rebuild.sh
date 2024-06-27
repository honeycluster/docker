#!/bin/bash

# IFS=$'\n'

# Show list of all docker containers
result=$(docker compose config --services 2>&1)
handled=""

for word in $result; do
  handled+=" $word"
done

echo $handled

# echo "the first value in the str array is: ${result[0]}"

echo 'Which container would you like to rebuild:'
options=($result)
select opt in "${options[@]}"
do
	echo "You selected: $opt"
	name=$opt
	docker compose build --no-cache $name
	docker container stop $name
	docker container rm $name
	docker compose up -d $name
	exit
done



#!/bin/bash

# Show list of all docker containers
docker ps -a

# Ask for container id which to clean up
echo Which container would you like to clean up?
read id

docker rm -vf $id

# Show all images
docker image ls

# Ask for which image id to clean up
echo Which image would you like to prune?
read image

docker rmi -f $image

# Begin pruning containers, iamges, volumes, builder cache
docker container prune -f
docker image prune -f
docker volume prune -f
docker builder prune -f

# Alternative way to clean docker of all dangling items
docker system prune -af 

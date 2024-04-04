
### build and start docker 
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update

apt-cache policy docker-ce
sudo apt install docker-ce
sudo systemctl status docker
### isntall docker dcompose


### start containers
sudo docker compose -f devDocker/docker-compose.yaml up -d

### stop all containers and rm them
sudo docker stop $(sudo docker ps -a -q)
sudo docker rm $(sudo docker ps -a -q)
sudo docker compose -f devDocker/docker-compose.yaml up -d

resourceGroupName="csc519-devops-rg"
location="eastus"

if [ ! -f ~/.ssh/id_rsa.pub ]; then
  ssh-keygen -q -m PEM -N "" -t rsa -b 4096 -f ~/.ssh/id_rsa
fi

sshPublicKey=$(cat ~/.ssh/id_rsa.pub) &&

az login --service-principal --username 5877c0e5-9640-4803-9b1d-e5a35a93fd6d --password $1 --tenant 97ee7d11-b45f-4b10-8d7d-e180450fe17e

az group create --name $resourceGroupName --location $location &&

# Create the infrastructure contained in arm_template.json
az deployment group create \
  --name CSC519-DevOps-M3 \
  --resource-group $resourceGroupName \
  --template-file /bakerx/lib/arm_template.json \
  --parameters sshPublicKey="$sshPublicKey" &&

# Install dependencies on the VMs
az vm run-command invoke \
  --resource-group $resourceGroupName \
  -n BlueVM \
  --command-id RunShellScript \
  --scripts "apt-get update -y && apt-get install -yqq python3-pip openjdk-11-jdk maven docker.io"

az vm run-command invoke \
  --resource-group $resourceGroupName \
  -n GreenVM \
  --command-id RunShellScript \
  --scripts "apt-get update -y && apt-get install -yqq python3-pip openjdk-11-jdk maven docker.io"

# Start mysql server on the VMs
az vm run-command invoke \
  --resource-group $resourceGroupName \
  -n BlueVM \
  --command-id RunShellScript \
  --scripts "sudo docker run --name mysql --network host -e MYSQL_ROOT_PASSWORD=$2 -d mysql:8.0"

az vm run-command invoke \
  --resource-group $resourceGroupName \
  -n GreenVM \
  --command-id RunShellScript \
  --scripts "sudo docker run --name mysql --network host -e MYSQL_ROOT_PASSWORD=$2 -d mysql:8.0"

BLUE=$(az vm show --resource-group csc519-devops-rg --name BlueVM --show-details --query '{vmname:name, admin:osProfile.adminUsername, ip:publicIps}')
GREEN=$(az vm show --resource-group csc519-devops-rg --name GreenVM --show-details --query '{vmname:name, admin:osProfile.adminUsername, ip:publicIps}')
LBIP=$(az network public-ip show -g $resourceGroupName -n publicIP_lb --query {"lbip:ipAddress"})

# Create inventory file in JSON format
touch inventory
echo "" > inventory
echo ${LBIP::-1}, >> inventory
echo \"green\":$GREEN, >> inventory
echo \"blue\":$BLUE >> inventory
echo "}" >> inventory

cp inventory /bakerx/inventory


# Add GreenVM to load balancer pool
#az network nic ip-config address-pool add -g csc519-devops-rg --lb-name rg0_lb --address-pool BackendPool1 --ip-config-name ipconfig1 --nic-name GreenVM_nic

# Add BlueVM to load balancer pool
#az network nic ip-config address-pool add -g csc519-devops-rg --lb-name rg0_lb --address-pool BackendPool1 --ip-config-name ipconfig1 --nic-name BlueVM_nic

# Remove GreenVM from load balancer pool
# az network nic ip-config address-pool remove -g csc519-devops-rg --lb-name rg0_lb --address-pool BackendPool1 --ip-config-name ipconfig1 --nic-name GreenVM_nic

# Remove BlueVM from load balancer pool
# az network nic ip-config address-pool remove -g csc519-devops-rg --lb-name rg0_lb --address-pool BackendPool1 --ip-config-name ipconfig1 --nic-name BlueVM_nic
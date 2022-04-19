resourceGroupName="csc519-devops-rg"
location="eastus"

if [ ! -f ~/.ssh/id_rsa.pub ]; then
  ssh-keygen -q -m PEM -N "" -t rsa -b 4096 -f ~/.ssh/id_rsa
fi

sshPublicKey=$(cat ~/.ssh/id_rsa.pub) &&

az login --service-principal --username 5877c0e5-9640-4803-9b1d-e5a35a93fd6d --password $1 --tenant 97ee7d11-b45f-4b10-8d7d-e180450fe17e

# az group create --name $resourceGroupName --location $location &&

# Create the infrastructure contained in arm_template.json
# az deployment group create \
#   --name CSC519-DevOps-M3 \
#   --resource-group $resourceGroupName \
#   --template-file /bakerx/lib/arm_template.json \
#   --parameters sshPublicKey="$sshPublicKey" &&

# # Create the mysql container
# az container create \
#   --resource-group $resourceGroupName \
#   --name mysql \
#   --image mysql:8.0 \
#   --ports 80 3306 \
#   --environment-variables MYSQL_ROOT_PASSWORD=$2 \
#   --vnet rg0-vnet \
#   --subnet subnet1

# # Install dependencies on the VMs
# az vm run-command invoke \
#   --resource-group $resourceGroupName \
#   -n BlueVM \
#   --command-id RunShellScript \
#   --scripts "apt-get update -y && apt-get install -yqq python3-pip openjdk-11-jdk maven"

# az vm run-command invoke \
#   --resource-group $resourceGroupName \
#   -n GreenVM \
#   --command-id RunShellScript \
#   --scripts "apt-get update -y && apt-get install -yqq python3-pip openjdk-11-jdk maven"

blue=$(az vm show --resource-group csc519-devops-rg --name BlueVM --show-details --query '{VMName:name, admin:osProfile.adminUsername}')
green=$(az vm show --resource-group csc519-devops-rg --name GreenVM --show-details --query '{VMName:name, admin:osProfile.adminUsername}')

echo $blue
echo $green

# az vm show --resource-group $resourceGroupName --name BlueVM --show-details \
#   --query "{VMName:name, VMStatus:powerState, IPs:publicIps}" \
#   --output json &&
# az vm show --resource-group $resourceGroupName --name GreenVM --show-details --query publicIps --output tsv
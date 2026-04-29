#!/usr/bin/env bash
# Run this in Azure Cloud Shell (https://shell.azure.com)
# Creates the NetzTech VM with all required ports open
set -e

RESOURCE_GROUP="netztech-rg"
VM_NAME="netztech-vm"
LOCATION="eastus"
VM_SIZE="Standard_B2s"
IMAGE="Ubuntu2204"
ADMIN_USER="azureuser"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     NetzTech Azure VM Setup          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Resource group ────────────────────────────────────────────────────────────
echo "→ Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# ── VM ────────────────────────────────────────────────────────────────────────
echo "→ Creating VM (this takes ~2 minutes)..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --image "$IMAGE" \
  --size "$VM_SIZE" \
  --admin-username "$ADMIN_USER" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --output none

# ── Open ports ────────────────────────────────────────────────────────────────
echo "→ Opening ports 80, 443, 25565..."
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 80    --priority 1001 --output none
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 443   --priority 1002 --output none
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 25565 --priority 1003 --output none

# ── Get public IP ─────────────────────────────────────────────────────────────
PUBLIC_IP=$(az vm show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --show-details \
  --query publicIps \
  --output tsv)

echo ""
echo "╔══════════════════════════════════════╗"
echo "║           VM Ready!                  ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "  Public IP:  $PUBLIC_IP"
echo "  SSH:        ssh $ADMIN_USER@$PUBLIC_IP"
echo ""
echo "NEXT STEPS:"
echo "  1. Point playnetztech.xyz DNS A record → $PUBLIC_IP"
echo "     (wait 5-10 min for DNS to propagate before running deploy.sh)"
echo ""
echo "  2. Upload project files:"
echo "     scp -r ~/mc-server $ADMIN_USER@$PUBLIC_IP:~/"
echo ""
echo "  3. SSH in and run the deploy script:"
echo "     ssh $ADMIN_USER@$PUBLIC_IP"
echo "     bash ~/mc-server/deploy.sh"
echo ""

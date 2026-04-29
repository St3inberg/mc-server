# NetzTech Deployment Guide

## Current Server

- **Provider:** Azure (student credits)
- **IP:** 20.25.31.246
- **User:** azureuser
- **Size:** Standard_B2s (2 vCPU, 4GB RAM) — ~$30/month
- **Domain:** playnetztech.xyz

## SSH Access

The SSH key was downloaded from Azure Cloud Shell (`~/.ssh/id_rsa`).

```bash
ssh -i ~/.ssh/id_rsa azureuser@20.25.31.246
```

## Deploying

1. **Upload project files** (from your local machine):
   ```bash
   rsync -av --exclude='.claude' --exclude='skills-lock.json' --exclude='azure-create-vm.sh' --exclude='setup.sh' ~/Documents/mc-server/ azureuser@20.25.31.246:~/mc-server/
   ```

2. **SSH in:**
   ```bash
   ssh -i ~/.ssh/id_rsa azureuser@20.25.31.246
   ```

3. **Run deploy script:**
   ```bash
   bash ~/mc-server/deploy.sh
   ```

   The script installs Java 21, Node 20, Nginx, Certbot, PM2, and downloads PaperMC.
   Make sure DNS is pointing to `20.25.31.246` before running — Certbot will fail otherwise.

## DNS (Namecheap)

Go to **playnetztech.xyz → Advanced DNS** and set:

| Type | Host | Value |
|---|---|---|
| A Record | @ | 20.25.31.246 |
| A Record | www | 20.25.31.246 |

Check propagation:
```bash
nslookup playnetztech.xyz
```

## After deploy.sh completes

1. Fill in environment variables:
   ```bash
   nano ~/mc-server/website/backend/.env
   ```
   - `JWT_SECRET` — run `openssl rand -hex 32`
   - `STRIPE_SECRET_KEY` — from Stripe dashboard
   - `STRIPE_WEBHOOK_SECRET` — from Stripe webhooks
   - `RCON_PASSWORD` — must match `minecraft/server.properties`

2. Restart the web server:
   ```bash
   pm2 restart netztech
   ```

3. Download LuckPerms and place in `~/mc-server/minecraft/plugins/`:
   - https://luckperms.net (download the Bukkit .jar)

4. Start Minecraft in a screen session:
   ```bash
   sudo apt-get install -y screen
   screen -S minecraft
   cd ~/mc-server/minecraft && ./start.sh
   # Detach: Ctrl+A then D
   ```

5. Make yourself admin (register on the site first):
   ```bash
   cd ~/mc-server/website/backend
   node -e "const db=require('./src/db');db.prepare('UPDATE users SET is_admin=1 WHERE email=?').run('stephen.stenberg@gmail.com')"
   ```

6. Set up Stripe webhook:
   - URL: `https://playnetztech.xyz/api/webhook/stripe`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

## Creating the Azure VM (Cloud Shell)

Run these in Azure Cloud Shell at shell.azure.com — switch to bash first by typing `bash`.

```bash
RESOURCE_GROUP="netztech-rg"
VM_NAME="netztech-vm"
az group create --name "$RESOURCE_GROUP" --location "eastus" --output none
az vm create --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --image Ubuntu2204 --size Standard_B2s --admin-username azureuser --generate-ssh-keys --public-ip-sku Standard --output none
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 80 --priority 1001 --output none
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 443 --priority 1002 --output none
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 25565 --priority 1003 --output none
az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --show-details --query publicIps --output tsv
```

Download the SSH key:
```bash
download ~/.ssh/id_rsa
```

## Migrating to Hetzner

Hetzner CX22 (2 vCPU, 4GB RAM) is ~€4–5/month vs Azure's ~$30/month.

### Step 1 — Back up the Azure server

SSH into the Azure server and run:
```bash
bash ~/mc-server/backup.sh
```

Then download the backup to your local machine:
```bash
scp -i ~/.ssh/id_rsa azureuser@20.25.31.246:~/netztech-backup-$(date +%Y%m%d).tar.gz ~/netztech-backup.tar.gz
```

### Step 2 — Create a Hetzner VPS

1. Go to console.hetzner.cloud → New Project → Add Server
2. Location: pick closest to your players
3. Image: **Ubuntu 22.04**
4. Type: **CX22** (2 vCPU, 4GB RAM, ~€4.35/mo)
5. SSH key: paste your public key (`cat ~/.ssh/id_rsa.pub`)
6. Firewall: create one with inbound rules for TCP 80, 443, 25565
7. Create — note the new IP

### Step 3 — Upload and deploy

```bash
# Update DNS in Namecheap to the new Hetzner IP first, then:
rsync -av --exclude='.claude' --exclude='skills-lock.json' --exclude='azure-create-vm.sh' --exclude='setup.sh' ~/Documents/mc-server/ root@<HETZNER_IP>:~/mc-server/
scp -i ~/.ssh/id_rsa ~/netztech-backup.tar.gz root@<HETZNER_IP>:~/netztech-backup.tar.gz
ssh -i ~/.ssh/id_rsa root@<HETZNER_IP>
```

On the Hetzner server:
```bash
bash ~/mc-server/deploy.sh
bash ~/mc-server/restore.sh ~/netztech-backup.tar.gz
```

### Step 4 — Delete the Azure VM

Once the Hetzner server is confirmed working:
```bash
az group delete --name netztech-rg --yes
```
This deletes the VM and stops all billing.

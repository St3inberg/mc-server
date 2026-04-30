#!/usr/bin/env bash
# Step 4 — Configure nginx reverse proxy and obtain SSL certificate
# Run AFTER your domain's DNS A record points to this server's IP.
set -e
echo "[4/6] Configuring nginx and SSL..."

read -p "Domain [playnetztech.xyz]: " DOMAIN
DOMAIN="${DOMAIN:-playnetztech.xyz}"

sudo tee /etc/nginx/conf.d/netztech.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    gzip on;
    gzip_types text/css application/javascript application/json text/plain;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_request_buffering off;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
echo "Nginx configured"

echo "Obtaining SSL certificate..."
sudo certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
  --non-interactive --agree-tos -m "admin@${DOMAIN}" \
  && echo "SSL certificate obtained" \
  || echo "WARN: Certbot failed. Make sure DNS points to this IP, then run manually:
  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

echo "[4/6] Done."

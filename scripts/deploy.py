#!/usr/bin/env python3
"""
Ramadhan Ceria - VPS Deployment (Clone from GitHub)
Clone repo → Docker backend → PM2 frontend → Nginx
VPS: 103.107.206.10:2480, User: ubuntu24
"""
import paramiko
import time
import secrets
import string

# ===== CONFIGURATION =====
VPS_IP = "103.107.206.10"
VPS_PORT = 2480
VPS_USER = "ubuntu24"
VPS_PASS = "Ubuntu@2025"
APP_NAME = "ramadhan-ceria"
VPS_APP_DIR = f"/home/{VPS_USER}/my-docker-apps/apps/{APP_NAME}"
GITHUB_REPO = "https://github.com/herulife/agenda-ramadhan.git"
DOMAIN = "cintabuku.site"

# Generated secrets
DB_PASSWORD = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(24))
JWT_SECRET = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(40))

def ssh_exec(client, cmd, desc="", use_sudo=False, timeout=300):
    """Execute command on VPS"""
    if use_sudo:
        cmd = f"echo '{VPS_PASS}' | sudo -S {cmd}"
    print(f"  🔧 {desc or cmd[:80]}")
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace').strip()
    errors = stderr.read().decode('utf-8', errors='replace').strip()
    if exit_code != 0 and errors:
        print(f"  ⚠️  {errors[:200]}")
    return output, errors, exit_code

def main():
    print("=" * 60)
    print("🌙 RAMADHAN CERIA — VPS Deployment (GitHub Clone)")
    print("=" * 60)
    print(f"📡 Target: {VPS_USER}@{VPS_IP}:{VPS_PORT}")
    print(f"📁 Path:   {VPS_APP_DIR}")
    print(f"🌐 Domain: {DOMAIN}")
    print(f"📦 Repo:   {GITHUB_REPO}")
    print(f"🔐 DB:     {DB_PASSWORD[:4]}{'*' * 16}")
    print(f"🔑 JWT:    {JWT_SECRET[:4]}{'*' * 16}")
    print()

    confirm = input("⚠️  Lanjutkan deploy? [y/N]: ").strip().lower()
    if confirm != 'y':
        print("❌ Dibatalkan.")
        return

    # Connect SSH
    print("\n📋 Step 1: Connecting to VPS...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS)
        print("  ✅ Connected!")
    except Exception as e:
        print(f"  ❌ SSH failed: {e}")
        return

    try:
        # Step 2: Clone repo
        print("\n📋 Step 2: Cloning repo from GitHub...")
        ssh_exec(client, f"rm -rf {VPS_APP_DIR}", "Cleaning old directory")
        ssh_exec(client, f"mkdir -p /home/{VPS_USER}/my-docker-apps/apps", "Ensuring parent dir")
        ssh_exec(client, f"git clone {GITHUB_REPO} {VPS_APP_DIR}", "Cloning repository")
        print("  ✅ Repo cloned!")

        # Step 3: Stop old containers
        print("\n📋 Step 3: Cleaning old containers...")
        ssh_exec(client, "docker stop ramadhan-backend ramadhan-db 2>/dev/null || true", "Stopping old containers", use_sudo=True)
        ssh_exec(client, "docker rm ramadhan-backend ramadhan-db 2>/dev/null || true", "Removing old containers", use_sudo=True)
        print("  ✅ Cleaned")

        # Step 4: Start PostgreSQL
        print("\n📋 Step 4: Starting PostgreSQL...")
        db_cmd = (
            f"docker run -d "
            f"--name ramadhan-db "
            f"--restart always "
            f"-e POSTGRES_USER=ramadhan_user "
            f"-e POSTGRES_PASSWORD={DB_PASSWORD} "
            f"-e POSTGRES_DB=ramadhan_ceria "
            f"-v ramadhan_db_data:/var/lib/postgresql/data "
            f"-p 5434:5432 "
            f"postgres:15-alpine"
        )
        ssh_exec(client, db_cmd, "Starting ramadhan-db", use_sudo=True)
        print("  ⏳ Waiting 10s for DB...")
        time.sleep(10)
        out, _, _ = ssh_exec(client, "docker exec ramadhan-db pg_isready -U ramadhan_user", "Health check", use_sudo=True)
        print(f"  ✅ DB ready")

        # Step 5: Build & Start Go Backend
        print("\n📋 Step 5: Building Go backend Docker image...")
        print("  ⏳ Ini bisa 2-5 menit (download Go modules + compile)...")
        ssh_exec(client, f"cd {VPS_APP_DIR}/backend && docker build -t ramadhan-backend .", "docker build", use_sudo=True, timeout=600)
        print("  ✅ Image built!")

        print("  🚀 Starting backend container...")
        backend_cmd = (
            f"docker run -d "
            f"--name ramadhan-backend "
            f"--restart always "
            f"--link ramadhan-db:ramadhan-db "
            f"-e DB_HOST=ramadhan-db "
            f"-e DB_USER=ramadhan_user "
            f"-e DB_PASSWORD={DB_PASSWORD} "
            f"-e DB_NAME=ramadhan_ceria "
            f"-e DB_PORT=5432 "
            f"-e PORT=3005 "
            f"-e JWT_SECRET={JWT_SECRET} "
            f"-p 3005:3005 "
            f"ramadhan-backend"
        )
        ssh_exec(client, backend_cmd, "Starting ramadhan-backend", use_sudo=True)
        time.sleep(5)
        print("  ✅ Backend running on port 3005")

        # Step 6: Build & Start Frontend
        print("\n📋 Step 6: Setting up Next.js frontend...")
        ssh_exec(client,
            f"echo 'NEXT_PUBLIC_API_URL=https://{DOMAIN}/api' > {VPS_APP_DIR}/frontend/.env.production",
            "Creating .env.production"
        )
        print("  📦 npm install (2-5 menit)...")
        ssh_exec(client, f"cd {VPS_APP_DIR}/frontend && npm install", "npm install", timeout=600)
        print("  🔨 next build (2-5 menit)...")
        ssh_exec(client, f"cd {VPS_APP_DIR}/frontend && npm run build", "next build", timeout=600)
        print("  ✅ Frontend built!")

        ssh_exec(client, "pm2 delete ramadhan-frontend 2>/dev/null || true", "Remove old PM2")
        ssh_exec(client,
            f"cd {VPS_APP_DIR}/frontend && PORT=3002 pm2 start npm --name ramadhan-frontend -- start",
            "Starting PM2"
        )
        ssh_exec(client, "pm2 save", "PM2 save")
        print("  ✅ Frontend running on port 3002")

        # Step 7: Nginx
        print("\n📋 Step 7: Configuring Nginx...")
        nginx_config = f"""# Ramadhan Ceria - {DOMAIN}
server {{
    listen 80;
    server_name {DOMAIN};

    location / {{
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:3005/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }}
}}

server {{
    listen 443 ssl;
    server_name {DOMAIN};

    ssl_certificate /etc/ssl/cloudflare/origin-cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/private-key.pem;

    location / {{
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:3005/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }}
}}"""

        ssh_exec(client,
            f"cat > /tmp/ramadhan_nginx.conf << 'NGINXEOF'\n{nginx_config}\nNGINXEOF",
            "Writing nginx config"
        )
        ssh_exec(client, f"cp /tmp/ramadhan_nginx.conf /etc/nginx/sites-available/{DOMAIN}", "Copying to sites-available", use_sudo=True)
        ssh_exec(client, f"ln -sf /etc/nginx/sites-available/{DOMAIN} /etc/nginx/sites-enabled/{DOMAIN}", "Enabling site", use_sudo=True)
        
        out, err, code = ssh_exec(client, "nginx -t 2>&1", "Testing nginx", use_sudo=True)
        if "successful" in out or code == 0:
            ssh_exec(client, "systemctl reload nginx", "Reloading nginx", use_sudo=True)
            print("  ✅ Nginx configured!")
        else:
            print(f"  ⚠️  Nginx test issue: {out[:200]}")
            ssh_exec(client, "systemctl reload nginx", "Force reloading nginx", use_sudo=True)

        # Step 8: Verify
        print("\n📋 Step 8: Verifying...")
        time.sleep(3)
        out, _, _ = ssh_exec(client, "docker ps --format '{{.Names}}\t{{.Status}}' | grep ramadhan", "Docker status", use_sudo=True)
        for line in out.split('\n'):
            if 'ramadhan' in line:
                print(f"  🐳 {line.strip()}")

        out, _, _ = ssh_exec(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3005/api/announcements 2>/dev/null || echo '000'", "Backend test")
        print(f"  🔌 Backend HTTP: {out.strip()[-3:]}")

        out, _, _ = ssh_exec(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3002 2>/dev/null || echo '000'", "Frontend test")
        print(f"  🌐 Frontend HTTP: {out.strip()[-3:]}")

        # DONE
        print("\n" + "=" * 60)
        print("🎉 DEPLOYMENT COMPLETE!")
        print("=" * 60)
        print(f"""
📌 Services:
   Frontend → http://{VPS_IP}:3002 (PM2)
   Backend  → http://{VPS_IP}:3005 (Docker)
   Database → ramadhan-db (Docker, port 5434)

🌐 Domain (Cloudflare DNS):
   Type: A | Name: {DOMAIN} | IPv4: {VPS_IP} | Proxy: ON
   SSL/TLS → Full (Strict)
   Akses: https://{DOMAIN}

🔐 SIMPAN CREDENTIALS INI:
   DB User:     ramadhan_user
   DB Password: {DB_PASSWORD}
   JWT Secret:  {JWT_SECRET}

🔧 Troubleshooting:
   ssh -p {VPS_PORT} {VPS_USER}@{VPS_IP}
   sudo docker logs ramadhan-backend
   pm2 logs ramadhan-frontend
""")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

# Required GitHub Secrets For CI/CD

Add these repository secrets before running `.github/workflows/main-pipeline.yml`:

- `DEPLOY_HOST`: VM public IP or hostname
- `DEPLOY_USER`: SSH user on VM
- `DEPLOY_SSH_KEY`: private SSH key content (PEM)
- `DEPLOY_PORT`: optional, default `22`
- `DEPLOY_PATH`: absolute path on VM for single-stack deployment
- `BE_APP_ENV`: optional multi-line backend `.env.app` content
- `STACK_ENV`: optional multi-line runtime `.env` content (Postgres, ports, etc.)

## Example paths

- `DEPLOY_PATH=/opt/petcarex`

## Example STACK_ENV

```env
POSTGRES_DB=petcare
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
PORT=3000
DB_HOST=db
DB_PORT=5432
DB_NAME=Petcare
DB_USERNAME=postgres
DB_PASSWORD=change_me
REDIS_HOST=redis
REDIS_PORT=6379
```

## Required Secrets For Ansible Workflow

Add these repository secrets before running `.github/workflows/infra-ansible.yml`:

- `ANSIBLE_SSH_PRIVATE_KEY`: private key content used to SSH to VM(s)
- `ANSIBLE_INVENTORY`: full Ansible inventory content (multi-line)

### Example ANSIBLE_INVENTORY

```ini
[petcare_servers]
vm-fe ansible_host=1.2.3.4 ansible_user=ubuntu
vm-be ansible_host=5.6.7.8 ansible_user=ubuntu

[all:vars]
ansible_python_interpreter=/usr/bin/python3
```

## How To Run Ansible Setup Workflow

1. Open Actions tab in GitHub.
2. Select `Infra Ansible Setup`.
3. Click `Run workflow`.
4. Set `limit`:
	- `petcare_servers` to run all VMs
	- `vm-fe` to run only FE VM
	- `vm-be` to run only BE VM
5. Set `dry_run=true` to test without applying changes.

## Branch Testing Behavior

- Pushes to any branch run FE/BE CI checks.
- Pull requests into `main` also run the CI checks.
- Image push and deploy only happen on direct pushes to `main`.

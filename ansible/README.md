# Ansible Infra Setup

Use this folder only when provisioning a new VM.

## Files

- `inventory.ini`: target hosts
- `setup-docker.yml`: install Docker, Docker Compose plugin, and basic UFW rules
- `ssh-key.pem`: private key (DO NOT COMMIT)

## Run

From project root:

```bash
ansible-galaxy collection install -r ansible/requirements.yml
ansible-playbook -i ansible/inventory.ini ansible/setup-docker.yml --private-key ansible/ssh-key.pem
```

## Notes

- The playbook assumes Ubuntu host(s).
- Opened ports by default: `22`, `80`, `443`.

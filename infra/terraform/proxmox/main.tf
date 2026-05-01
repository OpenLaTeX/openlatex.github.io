terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "~> 0.73"
    }
  }
}

provider "proxmox" {
  endpoint  = var.endpoint
  api_token = var.api_token
  insecure  = true

  ssh {
    agent    = true
    username = "terraform"
  }
}

resource "proxmox_virtual_environment_vm" "ubuntu" {
  name      = "ubuntu-server"
  node_name = "pve"

  cpu {
    cores = 1
  }

  memory {
    dedicated = 1024
  }

  disk {
    datastore_id = "local-lvm"
    size         = 20
    interface    = "scsi0"
  }

  network_device {
    bridge = "vmbr0"
  }
}
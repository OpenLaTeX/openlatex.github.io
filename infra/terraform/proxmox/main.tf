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
    agent       = false
    username    = "terraform"
    private_key = file("~/.ssh/proxmox_terraform")
  }
}

resource "proxmox_virtual_environment_vm" "ubuntu" {
  name      = "ubuntu-server"
  node_name = "homelab"

  cpu {
    cores = 1
  }

  memory {
    dedicated = 1024
  }

  agent {
    enabled = true
  }

  disk {
    datastore_id = "local-lvm"
    size         = 20
    interface    = "scsi0"
  }

  network_device {
    bridge = "vmbr0"
  }

  initialization {
    ip_config {
      ipv4 {
        address = "dhcp"
      }
    }

    user_account {
      keys     = [file(var.ssh_public_key_path)]
      username = "ubuntu"
    }
    user_data_file_id = proxmox_virtual_environment_file.user_data.id
  }
}

resource "proxmox_virtual_environment_file" "user_data" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = "homelab"

  source_raw {
    file_name = "user-data.yaml"
    data      = <<-EOF
      #cloud-config
      packages:
        - qemu-guest-agent
      runcmd:
        - systemctl enable qemu-guest-agent
        - systemctl start qemu-guest-agent
    EOF
  }
}
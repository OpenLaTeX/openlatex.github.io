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

resource "proxmox_virtual_environment_vm" "debian" {
  name      = "debian-server"
  node_name = "homelab"

  cpu {
    cores = 1
  }

  memory {
    dedicated = 1024
  }

  clone {
    vm_id = 9000
  }

  disk {
    datastore_id = "local-lvm"
    interface    = "scsi0"
    size         = 20
  }

  agent {
    enabled = true
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
      username = "debian"
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
      users:
        - name: debian
          sudo: ALL=(ALL) NOPASSWD:ALL
          shell: /bin/bash
          ssh_authorized_keys:
            - ${file(var.ssh_public_key_path)}
      packages:
        - qemu-guest-agent
      runcmd:
        - systemctl enable qemu-guest-agent
        - systemctl start qemu-guest-agent
    EOF
  }
}
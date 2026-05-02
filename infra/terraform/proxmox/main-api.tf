resource "proxmox_virtual_environment_vm" "openlatex-main-api" {
  name      = "openlatex-main-api"
  node_name = "homelab"

  cpu {
    cores = 1
  }

  memory {
    dedicated = 2048
  }

  clone {
    vm_id = 9000
  }

  disk {
    datastore_id = "local-lvm"
    interface    = "scsi0"
    size         = 30
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
  }
}
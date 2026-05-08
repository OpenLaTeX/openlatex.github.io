resource "proxmox_virtual_environment_vm" "openlatex-runner" {
  name      = "openlatex-runner"
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
    timeout = "600s"
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
      username = "admin"
    }
    user_data_file_id = proxmox_virtual_environment_file.runner_user_data.id
  }
}

resource "proxmox_virtual_environment_file" "runner_user_data" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = "homelab"

  source_raw {
    file_name = "user-data-runner.yaml"
    data = templatefile("${path.module}/cloud-init/user-data-runner.sh.tpl", {
      ssh_public_key_path = file(var.ssh_public_key_path)
      runner_token        = var.runner_token
    })
  }
}
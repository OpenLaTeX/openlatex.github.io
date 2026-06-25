resource "proxmox_virtual_environment_vm" "openlatex-main-api" {
  vm_id     = 251
  tags = ["openlatex", "service"]
  name      = "openlatex-main-api"
  node_name = "pve1"

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
    datastore_id = "encrypted-zfs"
    interface    = "scsi0"
    size         = 30
  }

  agent {
    enabled = true
    timeout = "600s"
  }

  network_device {
    bridge = "pubvnet1"
  }

  initialization {
    ip_config {
      ipv4 {
        address = "${var.main_api_ip}/24"
        gateway = var.kube_network_gateway
      }
    }
    datastore_id = "encrypted-zfs"

    user_account {
      keys     = [file(var.ssh_public_key_path)]
      username = "admin"
    }
    user_data_file_id = proxmox_virtual_environment_file.main-api_user_data.id
  }
}


resource "proxmox_virtual_environment_file" "main-api_user_data" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = "pve1"

  source_raw {
    file_name = "user-data-main-api.yaml"
    data = templatefile("${path.module}/cloud-init/user-data-main-api.sh.tpl", {
      ssh_public_key_path = file(var.ssh_public_key_path)
    })
  }
}
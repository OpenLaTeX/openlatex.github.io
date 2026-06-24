resource "proxmox_virtual_environment_vm" "openlatex-kube-master" {
  vm_id     = 252
  tags = ["openlatex", "kube-control-plane"]
  name      = "openlatex-kube-master"
  node_name = "pve1"

  cpu {
    cores = 1
  }

  memory {
    dedicated = 4196
  }

  clone {
    vm_id = 9000
  }

  disk {
    datastore_id = "encrypted-zfs"
    interface    = "scsi0"
    size         = 8
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
        address = "${var.kube_master_ip}/${var.kube_network_prefix}"
        gateway = var.kube_network_gateway
      }
    }
    datastore_id = "encrypted-zfs"

    user_account {
      keys     = [file(var.ssh_public_key_path)]
      username = "admin"
    }
    user_data_file_id = proxmox_virtual_environment_file.kube-master_user_data.id
  }
}

# token k3s aléatoire
resource "random_password" "k3s_token" {
  length  = 32
  special = false
}


resource "proxmox_virtual_environment_file" "kube-master_user_data" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = "pve1"

  source_raw {
    file_name = "user-data-kube-master.yaml"
    data = templatefile("${path.module}/cloud-init/user-data-kube-master.sh.tpl", {
      ssh_public_key_path = file(var.ssh_public_key_path)
      k3s_token           = random_password.k3s_token.result
      master_ip           = var.kube_master_ip
    })
  }
}
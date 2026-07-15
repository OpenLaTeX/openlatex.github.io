resource "proxmox_virtual_environment_vm" "openlatex-kube-worker" {
  count     = 2
  vm_id = 253 + count.index
  tags = ["openlatex", "kube-worker"]
  name      = "openlatex-kube-worker-${count.index}"
  node_name = "pve1"

  cpu {
    cores = 3
  }

  memory {
    dedicated = 8192
  }

  clone {
    vm_id = 9000
  }

  disk {
    datastore_id = "encrypted-zfs"
    interface    = "scsi0"
    size         = 15
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
        address = "${var.kube_worker_ip_prefix}.${var.kube_worker_ip_start + count.index}/24"        
        gateway = var.kube_network_gateway
      }
    }
    datastore_id = "encrypted-zfs"

    user_account {
      keys     = [file(var.ssh_public_key_path)]
      username = "admin"
    }
    user_data_file_id = proxmox_virtual_environment_file.kube-worker_user_data.id
  }

  # on attend avant de cloud init
  depends_on = [proxmox_virtual_environment_vm.openlatex-kube-master]
}


resource "proxmox_virtual_environment_file" "kube-worker_user_data" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = "pve1"

  source_raw {
    file_name = "user-data-kube-worker.yaml"
    data = templatefile("${path.module}/cloud-init/user-data-kube-worker.sh.tpl", {
      ssh_public_key_path = file(var.ssh_public_key_path)
      master_private_ip   = var.kube_master_ip
      k3s_token           = random_password.k3s_token.result
    })
  }
}
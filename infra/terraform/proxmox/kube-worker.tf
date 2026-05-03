resource "proxmox_virtual_environment_vm" "openlatex-kube-worker" {
  count     = 2
  name      = "openlatex-kube-worker"
  node_name = "homelab"

  cpu {
    cores = 1
  }

  memory {
    dedicated = 4096
  }

  clone {
    vm_id = 9000
  }

  disk {
    datastore_id = "local-lvm"
    interface    = "scsi0"
    size         = 15
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
      username = "debian"
    }
    user_data_file_id = proxmox_virtual_environment_file.kube-worker_user_data.id
  }

  depends_on = [proxmox_virtual_environment_vm.openlatex-kube-master]
}


resource "proxmox_virtual_environment_file" "kube-worker_user_data" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = "homelab"

  depends_on = [proxmox_virtual_environment_vm.openlatex-kube-master]

  source_raw {
    file_name = "user-data-kube-worker.yaml"
    data = templatefile("${path.module}/cloud-init/user-data-kube-worker.sh.tpl", {
      ssh_public_key_path = file(var.ssh_public_key_path)
      master_private_ip   = try(proxmox_virtual_environment_vm.openlatex-kube-master.ipv4_addresses[1][0], "")
      k3s_token           = random_password.k3s_token.result
    })
  }
}
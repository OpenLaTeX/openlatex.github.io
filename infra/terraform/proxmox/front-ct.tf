
resource "proxmox_virtual_environment_container" "front" {
  node_name    = "homelab"
  started      = true
  unprivileged = false

  initialization {
    hostname = "front"
    ip_config {
      ipv4 {
        address = "${var.front_ip}/24"
        gateway = var.gateway
      }
    }
    user_account {
      keys = [trimspace(file(var.ssh_public_key_path))]
    }
  }

  network_interface {
    name   = "eth0"
    bridge = "vmbr0"
  }

  operating_system {
    template_file_id = "local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst"
    type             = "debian"
  }

  cpu {
    cores = 1
  }

  memory {
    dedicated = 256
  }

  disk {
    datastore_id = "local-lvm"
    size         = 4
  }
}

# similaire à un cloud init (CT ne le supporte pas)
resource "null_resource" "front_init" {
  depends_on = [proxmox_virtual_environment_container.front]

  connection {
    type        = "ssh"
    host        = var.front_ip
    user        = "root"
    private_key = file(trimsuffix(var.ssh_public_key_path, ".pub"))
  }

  provisioner "file" {
    content = templatefile("${path.module}/cloud-init/user-data-front-ct.tpl", {
      ssh_public_key = trimspace(file(var.ssh_public_key_path))
    })
    destination = "/tmp/init.sh"
  }

  provisioner "remote-exec" {
    inline = ["chmod +x /tmp/init.sh && /tmp/init.sh"]
  }
}

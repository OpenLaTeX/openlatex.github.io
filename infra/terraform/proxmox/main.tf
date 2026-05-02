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
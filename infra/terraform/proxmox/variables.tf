variable "proxmox_endpoint" {
  type = string
}

variable "proxmox_api_token" {
  type      = string
  sensitive = true
}

variable "proxmox_insecure" {
  type      = string
  default = false
}


variable "ssh_public_key_path" {
  type = string
}

variable "runner_token" {
  type      = string
  sensitive = true
}

variable "main_api_ip" {
  type = string
}

variable "kube_master_ip" {
  type = string
}

variable "kube_worker_ip_prefix" {
  type    = string
  default = "172.16.10"
  description = "si c'est par exemple 172.16.10 ensuite on ajoute l'index de l'instance (puisqu'il y en a deux, on doit calculer les ip) avec un indice de départ de 52, cela résultera en 172.16.10.52 et puis 172.16.10.53 pour deux (ca demarre à zéro)"

}

variable "kube_worker_ip_start" {
  type    = number
}

variable "proxmox_ssh_private_key_path" {
  description = "Chemin de la cle privee SSH pour le node Proxmox."
  type        = string
  default     = "~/.ssh/proxmox_terraform"
}


variable "kube_network_gateway" {
  type = string
}

variable "kube_network_prefix" {
  type    = number
  default = 24
}

variable "proxmox_ssh_username" {
  description = "Utilisateur SSH sur le node Proxmox. Requis pour uploader les snippets/hook scripts."
  type        = string
  default     = "root"
}


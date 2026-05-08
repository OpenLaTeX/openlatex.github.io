variable "endpoint" {
  type = string
}

variable "api_token" {
  type      = string
  sensitive = true
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

variable "kube_network_gateway" {
  type = string
}

variable "kube_network_prefix" {
  type    = number
  default = 24
}

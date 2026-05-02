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

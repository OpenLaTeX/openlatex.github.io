variable "region" {
  description = "Région AWS"
  type        = string
  default     = "eu-west-3" # Paris
}

variable "ssh_public_key_path" {
  description = "Chemin à la clé publique SSH"
  type        = string
  default     = "~/.ssh/github_deploy_key.pub"
}

variable "api_instance_type" {
  description = "Type EC2 pour le VPS API"
  type        = string
  default     = "t3.micro"
}

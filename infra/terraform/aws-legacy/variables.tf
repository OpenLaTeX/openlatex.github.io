variable "region" {
  description = "Région AWS"
  type        = string
  default     = "eu-west-3" # Paris
}

variable "instance_type" {
  description = "Type EC2 (instance openlatex existante)"
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key_path" {
  description = "Chemin à la clé publique pour connexion"
  type        = string
  default     = "~/.ssh/github_deploy_key.pub"
}
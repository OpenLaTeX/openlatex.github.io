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

# Ton IP publique au format CIDR /32 (ex: "1.2.3.4/32").
# Restreint SSH et l'API k3s à toi seul.
# Obtenir ton IP : curl ifconfig.me
variable "my_ip" {
  description = "Votre IP publique /32 (ex: 1.2.3.4/32)"
  type        = string
}

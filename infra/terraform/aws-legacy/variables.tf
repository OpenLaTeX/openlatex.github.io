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
  default     = "../../github_deploy_key.pub"
}

# Ton IP publique au format CIDR /32 (ex: "1.2.3.4/32").
# Utilisée pour restreindre SSH et l'API k3s à toi seul.
# Obtenir ton IP : curl ifconfig.me
variable "my_ip" {
  description = "Votre IP publique /32 (ex: 1.2.3.4/32) pour restreindre SSH et l'API k3s"
  type        = string
}

# Token partagé entre le master k3s et les workers pour l'authentification du cluster.
# Générer avec : openssl rand -base64 32
# sensitive = true → masqué dans terraform output et les logs CI.
# Note : la valeur reste en clair dans le state file (utiliser un backend chiffré en prod).
variable "k3s_token" {
  description = "Token partagé k3s (générer avec: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

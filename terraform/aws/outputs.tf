output "public_ip" {
  description = "Elastic IP (statique) de l'instance"
  value       = aws_eip.openlatex.public_ip
}

output "ssh_command" {
  description = "Commande SSH pour se connecter (on prend la cle dans le dossier home ssh)"
  value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_eip.openlatex.public_ip}"
}

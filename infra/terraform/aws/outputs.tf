# VPS API

output "api_public_ip" {
  description = "Elastic IP statique du VPS API"
  value       = aws_eip.api.public_ip
}

output "api_private_ip" {
  description = "IP privée du VPS API (pour le remote-write Prometheus)"
  value       = aws_instance.api.private_ip
}

output "ssh_api" {
  description = "Commande SSH vers le VPS API"
  value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_eip.api.public_ip}"
}

# Cluster K3s

output "k3s_master_public_ip" {
  description = "Elastic IP statique du master k3s"
  value       = aws_eip.k3s_master.public_ip
}

output "ssh_master" {
  description = "Commande SSH vers le master k3s"
  value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_eip.k3s_master.public_ip}"
}

output "ssh_worker_0" {
  description = "Commande SSH vers worker-0"
  value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_instance.k3s_worker[0].public_ip}"
}

output "ssh_worker_1" {
  description = "Commande SSH vers worker-1"
  value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_instance.k3s_worker[1].public_ip}"
}

output "get_kubeconfig" {
  description = "Commande scp pour récupérer le kubeconfig depuis le master"
  value       = "scp -i ~/.ssh/github_deploy_key admin@${aws_eip.k3s_master.public_ip}:/etc/rancher/k3s/k3s.yaml ./k3s.yaml"
}

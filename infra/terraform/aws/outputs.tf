output "master_public_ip" {
  description = "Elastic IP statique du master k3s"
  value       = aws_eip.master.public_ip
}

output "worker_public_ips" {
  description = "IPs publiques éphémères des workers (changent au redémarrage)"
  value       = aws_instance.worker[*].public_ip
}

output "ssh_master" {
  description = "Commande SSH vers le master"
  value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_eip.master.public_ip}"
}

output "ssh_worker_0" {
  description = "Commande SSH vers worker-0"
  value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_instance.worker[0].public_ip}"
}

output "ssh_worker_1" {
  description = "Commande SSH vers worker-1"
  value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_instance.worker[1].public_ip}"
}

output "get_kubeconfig" {
  description = "Commande scp pour récupérer le kubeconfig depuis le master"
  value       = "scp -i ~/.ssh/github_deploy_key admin@${aws_eip.master.public_ip}:/etc/rancher/k3s/k3s.yaml ./k3s.yaml"
  // si ca deconne on a l'alternative :
  // value       = "ssh -i ~/.ssh/github_deploy_key admin@${aws_eip.master.public_ip} 'sudo cat /etc/rancher/k3s/k3s.yaml' > ./k3s.yaml

}

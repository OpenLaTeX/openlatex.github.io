output "openlatex_runner_ssh_vm" {
  description = "Commande SSH vers la vm Runner"
  value       = "ssh -t -i ~/.ssh/github_deploy_key admin@${try(proxmox_virtual_environment_vm.openlatex-runner.ipv4_addresses[1][0], "not-ready")}"
}

output "openlatex_main-api_ssh_vm" {
  description = "Commande SSH vers la vm main-api"
  value       = "ssh -t -i ~/.ssh/github_deploy_key admin@${try(proxmox_virtual_environment_vm.openlatex-main-api.ipv4_addresses[1][0], "not-ready")}"
}

output "openlatex_main-api_ip" {
  value = proxmox_virtual_environment_vm.openlatex-main-api.ipv4_addresses
}

output "openlatex_runner_ip" {
  value = proxmox_virtual_environment_vm.openlatex-runner.ipv4_addresses
}



# kube

output "openlatex_kube-master_ssh_vm" {
  description = "Commande SSH vers la vm kube master"
  value       = "ssh -t -i ~/.ssh/github_deploy_key admin@${try(proxmox_virtual_environment_vm.openlatex-kube-master.ipv4_addresses[1][0], "not-ready")}"
}


output "openlatex_kube-master_ip" {
  value = proxmox_virtual_environment_vm.openlatex-kube-master.ipv4_addresses
}



output "openlatex_kube-worker1_ssh_vm" {
  description = "Commande SSH vers la vm kube worker"
  value       = "ssh -t -i ~/.ssh/github_deploy_key admin@${try(proxmox_virtual_environment_vm.openlatex-kube-worker[0].ipv4_addresses[1][0], "not-ready")}"
}

output "openlatex_kube-worker1_ip" {
  value = proxmox_virtual_environment_vm.openlatex-kube-worker[0].ipv4_addresses
}

output "openlatex_kube-worker2_ssh_vm" {
  description = "Commande SSH vers la vm kube worker"
  value       = "ssh -t -i ~/.ssh/github_deploy_key admin@${try(proxmox_virtual_environment_vm.openlatex-kube-worker[1].ipv4_addresses[1][0], "not-ready")}"
}

output "openlatex_kube-worker2_ip" {
  value = proxmox_virtual_environment_vm.openlatex-kube-worker[1].ipv4_addresses
}


# output "openlatex_kube-random-k3s_token" {
#   value = proxmox_virtual_environment_vm.openlatex-kube-master.random_password.k3s_token.result
# }

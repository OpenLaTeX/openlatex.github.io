output "openlatex_runner_ssh_vm" {
  description = "Commande SSH vers la vm Runner"
  value       = "ssh -i ~/.ssh/github_deploy_key debian@${proxmox_virtual_environment_vm.openlatex-runner.ipv4_addresses[1][0]}"
}

output "openlatex_runner_ip" {
  value = proxmox_virtual_environment_vm.openlatex-runner.ipv4_addresses
}
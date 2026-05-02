output "ssh_vm" {
  description = "Commande SSH vers la vm testtt"
  value       = "ssh -i ~/.ssh/github_deploy_key debian@${proxmox_virtual_environment_vm.debian.ipv4_addresses[1][0]}"
}

output "debian_ip" {
  value = proxmox_virtual_environment_vm.debian.ipv4_addresses
}
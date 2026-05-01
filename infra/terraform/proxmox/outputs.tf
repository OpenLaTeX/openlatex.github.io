output "ssh_vm" {
  description = "Commande SSH vers la vm testtt"
  value       = "ssh -i ~/.ssh/github_deploy_key user@${proxmox_virtual_environment_vm.ubuntu.ipv4_addresses[0][0]}"
}

output "ubuntu_ip" {
  value = proxmox_virtual_environment_vm.ubuntu.ipv4_addresses
}
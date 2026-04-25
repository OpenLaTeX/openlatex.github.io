# Cluster K3s (service de compilation LaTeX : 1 master + 2 workers)

# token k3s aléatoire
resource "random_password" "k3s_token" {
  length  = 32
  special = false
}

# master k3s
#
# L'EIP est allouée EN PREMIER, avant l'instance.
# Son IP est connue dès la création (avant toute association),
# ce qui permet de la passer dans le user_data via templatefile()
# pour le --tls-san du certificat k3s.
resource "aws_eip" "k3s_master" {
  domain = "vpc"
  tags   = { Name = "openlatex-k3s-master-eip" }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_instance" "k3s_master" {
  ami                    = data.aws_ami.debian.id
  instance_type          = "t3.small"
  key_name               = aws_key_pair.main.key_name
  subnet_id              = aws_subnet.main.id
  vpc_security_group_ids = [aws_security_group.k3s.id]
  iam_instance_profile   = aws_iam_instance_profile.main.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user-data-master.sh.tpl", {
    k3s_token      = random_password.k3s_token.result
    public_ip      = aws_eip.k3s_master.public_ip
    api_private_ip = aws_instance.api.private_ip
  })

  lifecycle {
    ignore_changes = [user_data]
  }

  tags = { Name = "openlatex-k3s-master" }
}

resource "aws_eip_association" "k3s_master" {
  instance_id   = aws_instance.k3s_master.id
  allocation_id = aws_eip.k3s_master.id
}

# workers k3s
#
# master_private_ip est une valeur "computed" (connue après création du master).
# depends_on force Terraform à créer le master en premier.
resource "aws_instance" "k3s_worker" {
  count = 2

  ami                    = data.aws_ami.debian.id
  instance_type          = "t3.small"
  key_name               = aws_key_pair.main.key_name
  subnet_id              = aws_subnet.main.id
  vpc_security_group_ids = [aws_security_group.k3s.id]
  iam_instance_profile   = aws_iam_instance_profile.main.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user-data-worker.sh.tpl", {
    k3s_token         = random_password.k3s_token.result
    master_private_ip = aws_instance.k3s_master.private_ip
  })

  depends_on = [aws_instance.k3s_master]

  tags = { Name = "openlatex-k3s-worker-${count.index}" }
}

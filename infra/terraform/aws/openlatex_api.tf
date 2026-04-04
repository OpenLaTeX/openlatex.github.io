# VPS API principal (Docker Compose : account-manager, collab, postgres, caddy, grafana…)

resource "aws_eip" "api" {
  domain = "vpc"
  tags   = { Name = "openlatex-api-eip" }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_instance" "api" {
  ami                    = data.aws_ami.debian.id
  instance_type          = var.api_instance_type
  key_name               = aws_key_pair.main.key_name
  subnet_id              = aws_subnet.main.id
  vpc_security_group_ids = [aws_security_group.api.id]
  iam_instance_profile   = aws_iam_instance_profile.main.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = file("${path.module}/cloud-init-api.yml")

  tags = { Name = "openlatex-api" }
}

resource "aws_eip_association" "api" {
  instance_id   = aws_instance.api.id
  allocation_id = aws_eip.api.id
}

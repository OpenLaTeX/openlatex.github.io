terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_vpc" "openlatex" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "openlatex-vpc"
  }
}

resource "aws_subnet" "openlatex" {
  vpc_id                  = aws_vpc.openlatex.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.region}a"

  tags = {
    Name = "openlatex-subnet"
  }
}

resource "aws_internet_gateway" "openlatex" {
  vpc_id = aws_vpc.openlatex.id

  tags = {
    Name = "openlatex-igw"
  }
}

resource "aws_route_table" "openlatex" {
  vpc_id = aws_vpc.openlatex.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.openlatex.id
  }

  tags = {
    Name = "openlatex-rt"
  }
}

resource "aws_route_table_association" "openlatex" {
  subnet_id      = aws_subnet.openlatex.id
  route_table_id = aws_route_table.openlatex.id
}

resource "aws_security_group" "openlatex" {
  name        = "openlatex-sg"
  description = "Security group for OpenLatex"
  vpc_id      = aws_vpc.openlatex.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "openlatex-sg"
  }
}

resource "aws_key_pair" "openlatex" {
  key_name   = "openlatex-key"
  public_key = file(var.ssh_public_key_path)
}

data "aws_ami" "debian" {
  most_recent = true
  owners      = ["136693071363"] # Debian official

  filter {
    name   = "name"
    values = ["debian-12-amd64-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# IAM
resource "aws_iam_role" "openlatex" {
  name = "openlatex-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = { Name = "openlatex-node-role" }
}

resource "aws_iam_role_policy" "ssm_parameters" {
  name = "openlatex-ssm-parameters"
  role = aws_iam_role.openlatex.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter", "ssm:GetParametersByPath"]
      Resource = "arn:aws:ssm:${var.region}:*:parameter/openlatex/*"
    }]
  })
}

resource "aws_iam_instance_profile" "openlatex" {
  name = "openlatex-node-profile"
  role = aws_iam_role.openlatex.name
}

resource "aws_instance" "openlatex" {
  ami                    = data.aws_ami.debian.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.openlatex.key_name
  subnet_id              = aws_subnet.openlatex.id
  vpc_security_group_ids = [aws_security_group.openlatex.id]
  iam_instance_profile   = aws_iam_instance_profile.openlatex.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = file("${path.module}/cloud-init.yml")

  tags = {
    Name = "openlatex-vm"
  }
}

# Elastic IP (IP statique) pour que ca reste apres un redémarrage
resource "aws_eip" "openlatex" {
  domain = "vpc"

  tags = {
    Name = "openlatex-eip"
  }
}

# association entre l'EIP et l'instance
resource "aws_eip_association" "openlatex" {
  instance_id   = aws_instance.openlatex.id
  allocation_id = aws_eip.openlatex.id
}

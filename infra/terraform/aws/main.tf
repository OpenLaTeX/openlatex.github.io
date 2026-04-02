terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# reseau

resource "aws_vpc" "k3s" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "k3s-vpc" }
}

resource "aws_subnet" "k3s" {
  vpc_id                  = aws_vpc.k3s.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true  # les workers auront une IP publique éphémère sans EIP
  availability_zone       = "${var.region}a"

  tags = { Name = "k3s-subnet" }
}

resource "aws_internet_gateway" "k3s" {
  vpc_id = aws_vpc.k3s.id
  tags   = { Name = "k3s-igw" }
}

resource "aws_route_table" "k3s" {
  vpc_id = aws_vpc.k3s.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.k3s.id
  }

  tags = { Name = "k3s-rt" }
}

resource "aws_route_table_association" "k3s" {
  subnet_id      = aws_subnet.k3s.id
  route_table_id = aws_route_table.k3s.id
}

# security groups
# Un seul SG pour les 3 nodes. La règle catch-all intra-subnet couvre tous les
# ports k3s internes (etcd 2379/2380, CoreDNS 53, NodePort 30000-32767…)

resource "aws_security_group" "k3s" {
  name        = "k3s-sg"
  description = "Security group pour le cluster k3s"
  vpc_id      = aws_vpc.k3s.id

  ingress {
    description = "SSH operateur"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  ingress {
    description = "k3s API server"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Flannel VXLAN overlay"
    from_port   = 8472
    to_port     = 8472
    protocol    = "udp"
    cidr_blocks = ["10.0.1.0/24"]
  }

  ingress {
    description = "Kubelet"
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = ["10.0.1.0/24"]
  }

  # Web app publique
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Tout le trafic intra-cluster"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.1.0/24"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "k3s-sg" }
}

# ssh
resource "aws_key_pair" "k3s" {
  key_name   = "k3s-key"
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

# token k3s aléatoire
resource "random_password" "k3s_token" {
  length  = 32
  special = false
}

# master k3s

# L'EIP est allouée EN PREMIER, avant l'instance.
# Son IP est connue dès la création (avant toute association),
# ce qui permet de la passer dans le user_data via templatefile()
# pour le --tls-san du certificat k3s.
resource "aws_eip" "master" {
  domain = "vpc"
  tags   = { Name = "k3s-master-eip" }
}

resource "aws_instance" "master" {
  ami                    = data.aws_ami.debian.id
  instance_type          = "t3.small"
  key_name               = aws_key_pair.k3s.key_name
  subnet_id              = aws_subnet.k3s.id
  vpc_security_group_ids = [aws_security_group.k3s.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user-data-master.sh.tpl", {
    k3s_token  = random_password.k3s_token.result
    public_ip  = aws_eip.master.public_ip
  })

  tags = { Name = "k3s-master" }
}

resource "aws_eip_association" "master" {
  instance_id   = aws_instance.master.id
  allocation_id = aws_eip.master.id
}

# workers k3s
resource "aws_instance" "worker" {
  count = 2

  ami                    = data.aws_ami.debian.id
  instance_type          = "t3.small"
  key_name               = aws_key_pair.k3s.key_name
  subnet_id              = aws_subnet.k3s.id
  vpc_security_group_ids = [aws_security_group.k3s.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  # master_private_ip est une valeur "computed" (connue après création du master).
  # depends_on force Terraform à créer le master en premier
  user_data = templatefile("${path.module}/user-data-worker.sh.tpl", {
    k3s_token         = random_password.k3s_token.result
    master_private_ip = aws_instance.master.private_ip
  })

  depends_on = [aws_instance.master]

  tags = { Name = "k3s-worker-${count.index}" }
}

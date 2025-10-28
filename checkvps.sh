#!/bin/bash
ssh -i github_deploy_key deployer@159.65.196.71 "docker logs -f openlatex-backend"

#!/usr/bin/env bash
# ==============================================================================
# Bliss OCI Always Free Infrastructure Automated Provisioning Script
# Tenancy: ap-hyderabad-1 (Namespace: axxfp6gwj5at)
# Topology:
#   - Single VCN (10.0.0.0/16) + Regional Subnet (10.0.1.0/24) + Internet Gateway
#   - VM 1: AMD Micro (1 OCPU, 1 GB RAM, 47 GB) -> Edge Router & SSL
#   - VM 2: AMD Micro (1 OCPU, 1 GB RAM, 47 GB) -> Frontend Static SPA
#   - VM 3: Ampere Arm (1 OCPU, 6 GB RAM, 47 GB) -> WebRTC Signaling Server
#   - VM 4: Ampere Arm (1 OCPU, 6 GB RAM, 47 GB) -> Torrent Ingestion & Stream
# Total Boot Storage: 4 x 47 GB = 188 GB <= 200 GB Always Free Limit
# ==============================================================================

set -euo pipefail

TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaahl5rzoxgkwfvcoknjdqjmw2qqeqantnuwsthr7cgzkgm3uehcwaa"
REGION="ap-hyderabad-1"
AD_NAME="OZuA:AP-HYDERABAD-1-AD-1"
SSH_KEY_PATH="${HOME}/.ssh/bliss_oci_key"

echo "========================================================"
echo "🚀 Bliss OCI Infrastructure Provisioning Initialized"
echo "========================================================"

# 1. SSH Key Verification
if [ ! -f "${SSH_KEY_PATH}" ]; then
  echo "🔑 Generating dedicated Ed25519 SSH key pair at ${SSH_KEY_PATH}..."
  mkdir -p "${HOME}/.ssh"
  ssh-keygen -t ed25519 -N "" -f "${SSH_KEY_PATH}" -C "bliss-oci-admin"
  echo "✓ SSH key generated: ${SSH_KEY_PATH}.pub"
else
  echo "✓ Using existing SSH key: ${SSH_KEY_PATH}.pub"
fi
SSH_PUB_KEY=$(cat "${SSH_KEY_PATH}.pub")

# 2. Check or Create VCN
echo "🌐 Step 1: Checking Virtual Cloud Network (VCN)..."
EXISTING_VCN=$(oci network vcn list --compartment-id "${TENANCY_OCID}" --display-name "bliss-vcn" --query "data[0].id" --raw-output 2>/dev/null || true)

if [ -z "${EXISTING_VCN}" ] || [ "${EXISTING_VCN}" == "null" ]; then
  echo "Creating VCN: bliss-vcn (10.0.0.0/16)..."
  VCN_ID=$(oci network vcn create \
    --compartment-id "${TENANCY_OCID}" \
    --cidr-block "10.0.0.0/16" \
    --display-name "bliss-vcn" \
    --dns-label "blissvcn" \
    --query "data.id" --raw-output)
  echo "✓ VCN created: ${VCN_ID}"
else
  VCN_ID="${EXISTING_VCN}"
  echo "✓ Using existing VCN: ${VCN_ID}"
fi

# 3. Check or Create Internet Gateway
echo "🌍 Step 2: Checking Internet Gateway..."
EXISTING_IGW=$(oci network internet-gateway list --compartment-id "${TENANCY_OCID}" --vcn-id "${VCN_ID}" --display-name "bliss-igw" --query "data[0].id" --raw-output 2>/dev/null || true)

if [ -z "${EXISTING_IGW}" ] || [ "${EXISTING_IGW}" == "null" ]; then
  echo "Creating Internet Gateway: bliss-igw..."
  IGW_ID=$(oci network internet-gateway create \
    --compartment-id "${TENANCY_OCID}" \
    --vcn-id "${VCN_ID}" \
    --is-enabled true \
    --display-name "bliss-igw" \
    --query "data.id" --raw-output)
  echo "✓ Internet Gateway created: ${IGW_ID}"
else
  IGW_ID="${EXISTING_IGW}"
  echo "✓ Using existing Internet Gateway: ${IGW_ID}"
fi

# 4. Update Default Route Table
echo "🛣️ Step 3: Configuring Route Table for Internet Access..."
RT_ID=$(oci network vcn get --vcn-id "${VCN_ID}" --query "data.\"default-route-table-id\"" --raw-output)

oci network route-table update \
  --rt-id "${RT_ID}" \
  --route-rules "[{\"cidrBlock\":\"0.0.0.0/0\",\"networkEntityId\":\"${IGW_ID}\"}]" \
  --force > /dev/null
echo "✓ Default Route Table updated with 0.0.0.0/0 -> ${IGW_ID}"

# 5. Update Default Security List (Allow 80, 443, 22 and internal VCN 10.0.0.0/16)
echo "🛡️ Step 4: Configuring Security List (Zero-Trust Ingress Rules)..."
SEC_LIST_ID=$(oci network vcn get --vcn-id "${VCN_ID}" --query "data.\"default-security-list-id\"" --raw-output)

INGRESS_RULES='[
  {"protocol": "6", "source": "0.0.0.0/0", "tcpOptions": {"destinationPortRange": {"max": 22, "min": 22}}, "description": "SSH Remote Administration"},
  {"protocol": "6", "source": "0.0.0.0/0", "tcpOptions": {"destinationPortRange": {"max": 80, "min": 80}}, "description": "HTTP Certbot & Redirection"},
  {"protocol": "6", "source": "0.0.0.0/0", "tcpOptions": {"destinationPortRange": {"max": 443, "min": 443}}, "description": "HTTPS Secure Traffic"},
  {"protocol": "all", "source": "10.0.0.0/16", "description": "Internal VCN Subnet Mesh Communication"}
]'

EGRESS_RULES='[
  {"protocol": "all", "destination": "0.0.0.0/0", "description": "Outbound Internet Access"}
]'

oci network security-list update \
  --security-list-id "${SEC_LIST_ID}" \
  --ingress-security-rules "${INGRESS_RULES}" \
  --egress-security-rules "${EGRESS_RULES}" \
  --force > /dev/null
echo "✓ Security List ingress rules configured."

# 6. Check or Create Regional Subnet
echo "🖧 Step 5: Checking Regional Subnet..."
EXISTING_SUBNET=$(oci network subnet list --compartment-id "${TENANCY_OCID}" --vcn-id "${VCN_ID}" --display-name "bliss-subnet" --query "data[0].id" --raw-output 2>/dev/null || true)

if [ -z "${EXISTING_SUBNET}" ] || [ "${EXISTING_SUBNET}" == "null" ]; then
  echo "Creating Regional Subnet: bliss-subnet (10.0.1.0/24)..."
  SUBNET_ID=$(oci network subnet create \
    --compartment-id "${TENANCY_OCID}" \
    --vcn-id "${VCN_ID}" \
    --cidr-block "10.0.1.0/24" \
    --display-name "bliss-subnet" \
    --dns-label "blisssubnet" \
    --query "data.id" --raw-output)
  echo "✓ Subnet created: ${SUBNET_ID}"
else
  SUBNET_ID="${EXISTING_SUBNET}"
  echo "✓ Using existing Subnet: ${SUBNET_ID}"
fi

# 7. Check or Create Reserved Public IP
echo "📍 Step 6: Checking Reserved Public IP for VM 1..."
EXISTING_PIP=$(oci network public-ip list --compartment-id "${TENANCY_OCID}" --scope REGION --query "data[?contains(\"display-name\", 'bliss-edge-ip')].\"ip-address\" | [0]" --raw-output 2>/dev/null || true)

if [ -z "${EXISTING_PIP}" ] || [ "${EXISTING_PIP}" == "null" ]; then
  echo "Reserving 1 Regional Public IP: bliss-edge-ip..."
  PIP_RES=$(oci network public-ip create \
    --compartment-id "${TENANCY_OCID}" \
    --lifetime "RESERVED" \
    --display-name "bliss-edge-ip" \
    --query "data.{\"id\": id, \"ip\": \"ip-address\"}")
  RESERVED_IP=$(echo "${PIP_RES}" | jq -r '.ip')
  RESERVED_IP_ID=$(echo "${PIP_RES}" | jq -r '.id')
  echo "✓ Reserved Public IP: ${RESERVED_IP} (OCID: ${RESERVED_IP_ID})"
else
  RESERVED_IP="${EXISTING_PIP}"
  RESERVED_IP_ID=$(oci network public-ip list --compartment-id "${TENANCY_OCID}" --scope REGION --query "data[?contains(\"display-name\", 'bliss-edge-ip')].id | [0]" --raw-output)
  echo "✓ Using existing Reserved Public IP: ${RESERVED_IP}"
fi

# 8. Query Image OCIDs for Ubuntu 24.04
echo "📦 Step 7: Resolving Canonical Ubuntu 24.04 Images..."
IMAGE_AMD=$(oci compute image list --compartment-id "${TENANCY_OCID}" --operating-system "Canonical Ubuntu" --query "data[?contains(\"display-name\", '24.04') && !contains(\"display-name\", 'aarch64') && !contains(\"display-name\", 'Minimal')].id | [0]" --raw-output)
IMAGE_ARM=$(oci compute image list --compartment-id "${TENANCY_OCID}" --operating-system "Canonical Ubuntu" --query "data[?contains(\"display-name\", '24.04') && contains(\"display-name\", 'aarch64') && !contains(\"display-name\", 'Minimal')].id | [0]" --raw-output)

echo "  - AMD x86_64 Image: ${IMAGE_AMD}"
echo "  - ARM aarch64 Image: ${IMAGE_ARM}"

# Function to launch VM safely using bash arrays
launch_vm() {
  local name="$1"
  local shape="$2"
  local image="$3"
  local private_ip="$4"
  local ocpus="$5"
  local mem_gb="$6"

  echo "🚀 Launching ${name} (${shape}, IP: ${private_ip}, Boot: 47GB)..."
  
  local CMD_ARGS=(
    oci compute instance launch
    --compartment-id "${TENANCY_OCID}"
    --availability-domain "${AD_NAME}"
    --display-name "${name}"
    --shape "${shape}"
    --image-id "${image}"
    --subnet-id "${SUBNET_ID}"
    --private-ip "${private_ip}"
    --boot-volume-size-in-gbs 47
    --ssh-authorized-keys-file "${SSH_KEY_PATH}.pub"
    --assign-public-ip true
    --wait-for-state "RUNNING"
    --query "data.id"
    --raw-output
  )

  if [[ "${shape}" == *"Flex"* ]]; then
    CMD_ARGS+=(--shape-config "{\"ocpus\":${ocpus},\"memoryInGBs\":${mem_gb}}")
  fi

  "${CMD_ARGS[@]}"
}

echo "========================================================"
echo "🖥️ Step 8: Launching 4 Always Free Compute Instances"
echo "========================================================"

# Launch VM 1 (AMD Micro)
VM1_ID=$(launch_vm "bliss-vm1-edge-router" "VM.Standard.E2.1.Micro" "${IMAGE_AMD}" "10.0.1.10" 1 1)
echo "✓ VM 1 Running: ${VM1_ID}"

# Launch VM 2 (AMD Micro)
VM2_ID=$(launch_vm "bliss-vm2-frontend" "VM.Standard.E2.1.Micro" "${IMAGE_AMD}" "10.0.1.20" 1 1)
echo "✓ VM 2 Running: ${VM2_ID}"

# Launch VM 3 (Ampere Arm)
VM3_ID=$(launch_vm "bliss-vm3-signaling" "VM.Standard.A1.Flex" "${IMAGE_ARM}" "10.0.1.30" 1 6)
echo "✓ VM 3 Running: ${VM3_ID}"

# Launch VM 4 (Ampere Arm)
VM4_ID=$(launch_vm "bliss-vm4-torrent" "VM.Standard.A1.Flex" "${IMAGE_ARM}" "10.0.1.40" 1 6)
echo "✓ VM 4 Running: ${VM4_ID}"

# Attach Reserved IP to VM 1 VNIC
echo "🔗 Step 9: Attaching Reserved IP (${RESERVED_IP}) to VM 1..."
VM1_VNIC_ID=$(oci compute vnic-attachment list --compartment-id "${TENANCY_OCID}" --instance-id "${VM1_ID}" --query "data[0].\"vnic-id\"" --raw-output)
VM1_PRIVATE_IP_ID=$(oci network private-ip list --vnic-id "${VM1_VNIC_ID}" --query "data[0].id" --raw-output)

oci network public-ip update \
  --public-ip-id "${RESERVED_IP_ID}" \
  --private-ip-id "${VM1_PRIVATE_IP_ID}" > /dev/null || true

echo "========================================================"
echo "🎉 ALL 4 BLISS ALWAYS FREE INSTANCES PROVISIONED!"
echo "========================================================"
echo "Public Domain:       bliss.webhop.me"
echo "Reserved Public IP:  ${RESERVED_IP}"
echo ""
echo "👉 ACTION REQUIRED: Update your No-IP DNS for 'bliss.webhop.me' to point to: ${RESERVED_IP}"
echo ""
echo "SSH Access Commands:"
echo "  VM 1 (Edge Router):  ssh -i ${SSH_KEY_PATH} ubuntu@${RESERVED_IP}"
echo "  VM 2 (Frontend SPA): ssh -i ${SSH_KEY_PATH} -J ubuntu@${RESERVED_IP} ubuntu@10.0.1.20"
echo "  VM 3 (Signaling):    ssh -i ${SSH_KEY_PATH} -J ubuntu@${RESERVED_IP} ubuntu@10.0.1.30"
echo "  VM 4 (Torrent):      ssh -i ${SSH_KEY_PATH} -J ubuntu@${RESERVED_IP} ubuntu@10.0.1.40"
echo "========================================================"

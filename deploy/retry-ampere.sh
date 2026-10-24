#!/usr/bin/env bash
# ==============================================================================
# Bliss Ampere A1 Capacity Grabber
# Continuously attempts to claim the 2 Always Free Ampere A1 instances (1 OCPU, 6GB RAM each)
# as soon as capacity frees up in ap-hyderabad-1 AD-1.
# ==============================================================================

set -uo pipefail

TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaahl5rzoxgkwfvcoknjdqjmw2qqeqantnuwsthr7cgzkgm3uehcwaa"
AD_NAME="OZuA:AP-HYDERABAD-1-AD-1"
SUBNET_ID="ocid1.subnet.oc1.ap-hyderabad-1.aaaaaaaal4xgyildiwia4ertgfzvit46zfm4pkihj3se7kxmusdpnbahdjka"
IMAGE_ARM="ocid1.image.oc1.ap-hyderabad-1.aaaaaaaacx5cw6qxwnemznb2wojrfdbkuepvgwzlwzqa2snxqslops3nmlua"
SSH_KEY_FILE="${HOME}/.ssh/bliss_oci_key.pub"

try_launch() {
  local name="$1"
  local private_ip="$2"

  echo "[$(date -u)] Checking if ${name} already exists..."
  local existing
  existing=$(oci compute instance list --compartment-id "${TENANCY_OCID}" --display-name "${name}" --query "data[?\"lifecycle-state\" == 'RUNNING' || \"lifecycle-state\" == 'PROVISIONING'].id | [0]" --raw-output 2>/dev/null || true)

  if [ -n "${existing}" ] && [ "${existing}" != "null" ]; then
    echo "✓ ${name} is already provisioned (${existing})."
    return 0
  fi

  echo "[$(date -u)] Attempting launch for ${name} (1 OCPU, 6GB RAM)..."
  oci compute instance launch \
    --compartment-id "${TENANCY_OCID}" \
    --availability-domain "${AD_NAME}" \
    --display-name "${name}" \
    --shape "VM.Standard.A1.Flex" \
    --shape-config '{"ocpus":1,"memoryInGBs":6}' \
    --image-id "${IMAGE_ARM}" \
    --subnet-id "${SUBNET_ID}" \
    --private-ip "${private_ip}" \
    --boot-volume-size-in-gbs 50 \
    --ssh-authorized-keys-file "${SSH_KEY_FILE}" \
    --assign-public-ip true \
    --query "data.id" --raw-output 2>&1
}

echo "Starting Ampere A1 capacity grabber for Bliss..."
try_launch "bliss-vm3-signaling" "10.0.1.30" || true
try_launch "bliss-vm4-torrent" "10.0.1.40" || true

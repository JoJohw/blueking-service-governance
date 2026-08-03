#!/bin/sh
# set -o xtrace
set -euo pipefail

: "${GIT_HTTP_USER:?missing GIT_HTTP_USER}"
: "${GIT_HTTP_PASS:?missing GIT_HTTP_PASS}"
: "${GIT_HTTP_EMAIL:?missing GIT_HTTP_EMAIL}"
: "${GIT_SAMPLE_REPO:?missing GIT_SAMPLE_REPO}"

until wget -q --spider http://git:3000/api/healthz; do
  sleep 2
done

gitea admin user create \
  --username "${GIT_HTTP_USER}" \
  --password "${GIT_HTTP_PASS}" \
  --email "${GIT_HTTP_EMAIL}" \
  --admin \
  --must-change-password=false >/dev/null 2>&1 || true

# Check if repository already exists
if curl -f -s "http://git:3000/api/v1/repos/${GIT_HTTP_USER}/${GIT_SAMPLE_REPO}" \
  -u "${GIT_HTTP_USER}:${GIT_HTTP_PASS}" >/dev/null 2>&1; then
  echo "Repository ${GIT_SAMPLE_REPO} already exists, exiting early"
  exit 0
fi

# Create the sample repository and push initial commit to add the values.yaml file for testing

curl -X POST "http://git:3000/api/v1/user/repos" \
  -u "${GIT_HTTP_USER}:${GIT_HTTP_PASS}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${GIT_SAMPLE_REPO}\",\"description\":\"Fixture repository used for git pull tests\",\"private\":false}" \
  >/dev/null 2>&1 || true

tmpdir="/tmp/git-init"
trap 'rm -rf "$tmpdir"' EXIT
git clone "http://${GIT_HTTP_USER}:${GIT_HTTP_PASS}@git:3000/${GIT_HTTP_USER}/${GIT_SAMPLE_REPO}.git" "${tmpdir}/repo"
cd "${tmpdir}/repo"
if [ ! -f values.yaml ]; then
  git config user.name "Fixture Bot"
  git config user.email "fixtures@example.com"
  cat <<'EOF' > values.yaml
# Default values for fixture git repository.
replicas: 1
image:
  repository: example.com/fixture
  tag: latest
service:
  type: ClusterIP
  port: 8080
EOF
  git add values.yaml
  git commit -m "Add values.yaml fixture"
  git branch -M main
  git push -u origin main
fi
